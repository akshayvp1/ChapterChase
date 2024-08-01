const Category = require('../models/categoryModel');



//load category list
const loadCategoryList = async (req, res) => {
  try {
      let admin = req.session.user;
      const page = parseInt(req.query.page) || 1; // Current page
      const limit = parseInt(req.query.limit) || 10; // Number of items per page

      const categories = await Category.find({})
          .skip((page - 1) * limit)
          .limit(limit);

      const totalCategories = await Category.countDocuments();

      res.render('category-list', {
          categories,
          admin,
          currentPage: page,
          totalPages: Math.ceil(totalCategories / limit),
          limit
      });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'Server error' });
  }
};






//add category
const AddCategory = async (req, res) => {
  const { title } = req.body;

  const existingCategory = await Category.findOne({ title });

  if (existingCategory) {
    res.json({ success: false, message: "Category already exists" });
  } else {
    try {
      const { slug, description, status } = req.body;
      const newCategory = new Category({ title, slug, description, status });
      await newCategory.save();
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  }
}

//edit category
const editCategory = async (req, res) => {
  try {
    const { title, slug, status } = req.body;
    await Category.findByIdAndUpdate(req.params.id, { title, slug, status });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



module.exports = {
    loadCategoryList,
    AddCategory,
    editCategory,
   
   
}