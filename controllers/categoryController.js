const Category = require('../models/categoryModel');



//Load category list
const loadCategoryList =async (req,res)=>{
    try{
        const categories = await Category.find({})
      return res.render('category-list',{categories})
    }
    catch(error){
        console.log(error.message);
        res.status(500).json({ message: 'Server error' });
    }
}

const AddCategory = async (req, res) => {
  const { title } = req.body;

  const existingCategory = await Category.findOne({ title });

  if (existingCategory) {
    console.log("Category already exists");
    // return res.render('category-list', { message: "Email already exists" });     

  } else {
    try {
      const { slug, description, status } = req.body;
      const newCategory = new Category({ title, slug, description, status });
      await newCategory.save();
      res.redirect('/admin/category-list');
    } catch (error) {
      console.log(error.message);
    }
  }
}

const editCategory = async (req, res) => {
  try {
    const { title, slug, status } = req.body;
    await Category.findByIdAndUpdate(req.params.id, { title, slug, status });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error });
  }
};





module.exports = {
    loadCategoryList,
    AddCategory,
    editCategory,
   
   
}