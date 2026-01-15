// backend/controllers/authControllers.js
const User = require('../models/User');

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ msg: 'Terminal error: User not found.' });

    // Let Supabase generate AND send the code
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) throw error;

    res.json({ msg: 'Reset protocol initiated.' });
  } catch (err) {
    res.status(500).json({ msg: 'Email delivery failed.' });
  }
});