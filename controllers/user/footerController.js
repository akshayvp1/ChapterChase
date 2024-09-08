


const loadContact = async(req,res)=>{
    try{
        res.render('contact-us')
    }
    catch(error){
        console.log(error.messege);
        
    }
}
const loadAbout = async(req,res)=>{
    try{
        res.render('about')
    }
    catch(error){
        console.log(error.messege);
        
    }
}
const loadFaq = async(req,res)=>{
    try{
        res.render('faq')
    }
    catch(error){
        console.log(error.messege);
        
    }
}
const loadShop = async(req,res)=>{
    try{
        res.render('how-to-shop')
    }
    catch(error){
        console.log(error.messege);
        
    }
}
const loadPaymentMethode = async(req,res)=>{
    try{
        res.render('payment-methode')
    }
    catch(error){
        console.log(error.messege);
        
    }
}
const loadMoneyGuarantee = async(req,res)=>{
    try{
        res.render('money-back')
    }
    catch(error){
        console.log(error.messege);
        
    }
}
const loadTermsAndConditions = async(req,res)=>{
    try{
        res.render('terms-conditions')
    }
    catch(error){
        console.log(error.messege);
        
    }
}


module.exports={
    loadContact,
    loadAbout,
    loadFaq,
    loadShop,
    loadPaymentMethode,
    loadMoneyGuarantee,
    loadTermsAndConditions
}