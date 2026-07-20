import { GoogleGenerativeAI } from '@google/generative-ai';
import SupervisorProfile from '../models/SupervisorProfile.js';
import StudentProfile from '../models/StudentProfileModel.js';
import ThesisTopic from '../models/ThesisTopic.js';
import User from '../models/userModel.js';

// @desc    Get AI-based recommendations for a student via Gemini API
// @route   GET /api/recommendations
// @access  Private (Student only)
export const getRecommendations = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const studentId = req.user._id;

    if (req.user.role !== 'student') {
      res.status(403);
      throw new Error('Only students can get recommendations');
    }

    // 1. Fetch the student's profile to get their research interests
    const studentProfile = await StudentProfile.findOne({ userId: studentId }).lean();
    let studentInterests = [];
    if (studentProfile && studentProfile.researchInterests) {
      studentInterests = studentProfile.researchInterests;
    } else {
      const user = await User.findById(studentId).lean();
      studentInterests = user.researchInterests || [];
    }

    // 2. Fetch all Supervisors and Topics
    const supervisors = await SupervisorProfile.find({})
      .populate('userId', 'fullName email department profilePicture')
      .lean();
    const validSupervisors = supervisors.filter(sup => sup.userId !== null);

    const topics = await ThesisTopic.find({ status: 'available' })
      .populate('supervisorId', 'fullName department')
      .lean();

    // 3. Fallback to algorithmic if no API key is provided yet
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing! Using fallback algorithmic engine.");
      return res.status(200).json({
        success: true,
        message: "Using fallback engine. Add GEMINI_API_KEY to .env for real AI.",
        data: {
          metadata: {
            modelUsed: "Algorithmic Matcher (Fallback)",
            processingTimeMs: Date.now() - startTime,
            input: studentInterests
          },
          recommendedSupervisors: [],
          recommendedTopics: []
        }
      });
    }

    // Helper function for fallback algorithm
    const calculateSimilarity = (arr1, arr2) => {
      if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
      const set1 = new Set(arr1.map(s => s.toLowerCase().trim()));
      const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));
      let intersection = 0;
      for (let item of set1) {
        if (set2.has(item)) intersection++;
      }
      return intersection;
    };

    let aiData;
    let usedModelName = "Gemini 1.5 Flash";
    
    try {
      // 4. Initialize Gemini API
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 5. Construct the Prompt payload
      const supDataForAI = validSupervisors.map(sup => ({
        id: sup.userId._id.toString(),
        name: sup.userId.fullName,
        expertise: sup.expertise || [],
        interests: sup.researchInterests || []
      }));

      const topicDataForAI = topics.map(t => ({
        id: t._id.toString(),
        title: t.title,
        keywords: t.keywords || []
      }));

      const prompt = `
      You are an intelligent thesis advisor matching system. 
      A student is looking for thesis supervisors and research topics.
      
      Student's Research Interests: ${JSON.stringify(studentInterests)}
      
      Available Supervisors:
      ${JSON.stringify(supDataForAI)}
      
      Available Topics:
      ${JSON.stringify(topicDataForAI)}
      
      Analyze the student's interests against the supervisors and topics.
      Return ONLY a valid JSON object (no markdown, no extra text) with the following structure:
      {
        "recommendedSupervisors": [
          { "id": "supervisor_id_here", "matchPercentage": 95 }
        ],
        "recommendedTopics": [
          { "id": "topic_id_here", "matchPercentage": 88 }
        ]
      }
      Return exactly the top 3 best matching supervisors and top 3 best matching topics.
      Match percentage should be an integer from 0 to 100 representing how well their expertise aligns with the student's interests.
      `;

      // 6. Call Gemini API
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/```\n?$/, '');
      }
      
      aiData = JSON.parse(text);
    } catch (apiError) {
      console.error("Gemini API Error or Invalid Key:", apiError.message);
      console.log("Falling back to local algorithmic math engine...");
      usedModelName = "Local Algorithmic Math (Fallback)";
      
      // Fallback Algorithmic Engine if API key is invalid
      const rankedSupervisors = validSupervisors.map(sup => {
        const supKeywords = [...(sup.expertise || []), ...(sup.researchInterests || [])];
        const score = calculateSimilarity(studentInterests, supKeywords);
        return { id: sup.userId._id.toString(), matchPercentage: studentInterests.length > 0 ? Math.round((score / studentInterests.length) * 100) : 0, score };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      const rankedTopics = topics.map(topic => {
        const score = calculateSimilarity(studentInterests, topic.keywords || []);
        return { id: topic._id.toString(), matchPercentage: studentInterests.length > 0 ? Math.round((score / studentInterests.length) * 100) : 0, score };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      aiData = {
        recommendedSupervisors: rankedSupervisors,
        recommendedTopics: rankedTopics
      };
    }

    // 7. Map AI recommendations back to full database objects for the frontend
    const recommendedSupervisors = aiData.recommendedSupervisors.map(aiSup => {
      const fullSup = validSupervisors.find(s => s.userId._id.toString() === aiSup.id);
      if (!fullSup) return null;
      return {
        _id: fullSup.userId._id,
        fullName: fullSup.userId.fullName,
        department: fullSup.userId.department,
        profilePicture: fullSup.userId.profilePicture,
        designation: fullSup.designation,
        expertise: fullSup.expertise,
        matchPercentage: aiSup.matchPercentage
      };
    }).filter(Boolean); // Remove nulls if AI hallucinated an ID

    const recommendedTopics = aiData.recommendedTopics.map(aiTopic => {
      const fullTopic = topics.find(t => t._id.toString() === aiTopic.id);
      if (!fullTopic) return null;
      return {
        _id: fullTopic._id,
        title: fullTopic.title,
        description: fullTopic.description,
        category: fullTopic.category,
        supervisor: fullTopic.supervisorId ? fullTopic.supervisorId.fullName : 'Unassigned',
        supervisorId: fullTopic.supervisorId ? fullTopic.supervisorId._id : null,
        matchPercentage: aiTopic.matchPercentage
      };
    }).filter(Boolean);

    const processingTimeMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      data: {
        metadata: {
          modelUsed: usedModelName,
          processingTimeMs,
          input: studentInterests
        },
        recommendedSupervisors,
        recommendedTopics
      }
    });

  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    next(new Error('AI Recommendation Engine failed. Please try again later.'));
  }
};
