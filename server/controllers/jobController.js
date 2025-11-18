const Job = require('../models/Job');
const User = require('../models/User');

// Create a new job/internship posting
exports.createJob = async (req, res) => {
  try {
    console.log('Received job creation request:', req.body);
    
    // Check if all required fields are present
    if (!req.body.title || !req.body.company || !req.body.location || 
        !req.body.description || !req.body.requirements || !req.body.type) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        receivedData: req.body 
      });
    }
    
    const { title, company, location, description, requirements, type } = req.body;
    const userId = req.body.userId; // Assuming user ID is passed from frontend
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('Looking up user with ID:', userId);
    
    try {
      // Validate user is alumni
      const user = await User.findById(userId);
      console.log('User found:', user);
      
      if (!user) {
        console.log('User not found with ID:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.role !== 'alumni') {
        console.log('User is not an alumni:', user.role);
        return res.status(403).json({ error: 'Only alumni can post jobs/internships' });
      }

      const job = new Job({
        title,
        company,
        location,
        description,
        requirements,
        type,
        postedBy: userId
      });

      console.log('Saving job to database:', job);
      const savedJob = await job.save();
      console.log('Job saved successfully:', savedJob);
      
      res.status(201).json({ message: 'Job/Internship posted successfully', job: savedJob });
    } catch (userErr) {
      console.error('Error finding user or saving job:', userErr);
      return res.status(500).json({ error: 'Database error: ' + userErr.message });
    }
  } catch (err) {
    console.error('Create Job Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// Get all job/internship listings
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'email').sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Get Jobs Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get jobs posted by a specific alumni
exports.getMyJobs = async (req, res) => {
  try {
    const userId = req.params.userId;
    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Get My Jobs Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Apply for a job/internship
exports.applyForJob = async (req, res) => {
  try {
    console.log('Received application request:', req.body);
    const { jobId, studentId, proposal } = req.body;
    
    // Validate student ID
    if (!studentId) {
      console.log('Missing studentId in request');
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    // Validate user is a student
    console.log('Looking up student with ID:', studentId);
    const student = await User.findById(studentId);
    console.log('Student found:', student);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(403).json({ error: 'Only students can apply for jobs/internships' });
    }
    
    console.log('Looking up job with ID:', jobId);
    const job = await Job.findById(jobId);
    console.log('Job found:', job);
    
    if (!job) {
      return res.status(404).json({ error: 'Job/Internship not found' });
    }
    
    // Check if student already applied
    const studentIdStr = studentId.toString();
    const alreadyApplied = job.applications.some(app => app.student.toString() === studentIdStr);
    console.log('Already applied:', alreadyApplied);
    
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }
    
    // Add application to the job
    console.log('Adding application to job');
    job.applications.push({
      student: studentId,
      proposal
    });
    
    await job.save();
    console.log('Application saved successfully');
    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Apply For Job Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get job applications (for alumni)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId).populate({
      path: 'applications.student',
      select: 'email' // Add other fields you want to include
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job/Internship not found' });
    }
    
    res.status(200).json(job.applications);
  } catch (err) {
    console.error('Get Job Applications Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update application status (accept/reject)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId, status } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job/Internship not found' });
    }
    
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    application.status = status;
    await job.save();
    
    res.status(200).json({ message: `Application ${status}` });
  } catch (err) {
    console.error('Update Application Status Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
