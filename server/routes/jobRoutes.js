const express = require('express');
const { 
  createJob, 
  getJobs, 
  getMyJobs, 
  applyForJob, 
  getJobApplications,
  updateApplicationStatus 
} = require('../controllers/jobController');
const router = express.Router();

// Job/Internship routes
router.post('/create', createJob);
router.get('/all', getJobs);
router.get('/my-jobs/:userId', getMyJobs);
router.post('/apply', applyForJob);
router.get('/applications/:jobId', getJobApplications);
router.post('/update-application-status', updateApplicationStatus);

module.exports = router;
