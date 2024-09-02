const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});


userSchema.methods.comparePassword = async function(candidatePassword) {
    const user = this;
    try{
        return await bcrypt.compare(candidatePassword, user.password);
    }
    catch (error) {
        console.error('Error while comparing passwords:', error);
        return false;
    }
}

module.exports = mongoose.model('User', userSchema);