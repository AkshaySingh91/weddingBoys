import BtsRole from '../Models/btsRoleSchema.js';

// Get all BTS roles
export const getBtsRoles = async (req, res) => {
  try {
    const roles = await BtsRole.find({});
    res.status(200).json({ schema: roles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new BTS role
export const addBtsRole = async (req, res) => {
  try {
    const { title, key } = req.body;
    const newRole = new BtsRole({ title, key });
    await newRole.save();
    res.status(201).json({ role: newRole });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an existing BTS role
export const updateBtsRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { title, key } = req.body;
    const updatedRole = await BtsRole.findByIdAndUpdate(
      roleId,
      { title, key },
      { new: true }
    );
    if (!updatedRole) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ role: updatedRole });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a BTS role
export const deleteBtsRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const deletedRole = await BtsRole.findByIdAndDelete(roleId);
    if (!deletedRole) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
