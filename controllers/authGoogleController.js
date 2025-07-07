exports.getProfile = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Gunakan struktur data dari database
  res.json({
    name: req.user.name,
    email: req.user.email,
    photo: req.user.photo,
  });
};
  
exports.logout = (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};
