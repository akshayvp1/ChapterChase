const User = require('../../models/userModel');
const Wallet = require('../../models/walletModel')


const loadWallet = async(req,res)=>{
    try {
        // Assuming you have the user's ID in the session
        const userId = req.session.user.id;

        // Fetch the user's wallet
        const wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        // Render the wallet page with the wallet data
        res.render('wallet', { wallet: wallet });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).send('Internal Server Error');
    }

}

module.exports ={
    loadWallet
}