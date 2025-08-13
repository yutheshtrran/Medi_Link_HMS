import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({

    name: {type:String , required:true},

    email: {type:String , required:true , unique:true},

    password: {type:String , required:true},

    image: {type:String },

    speciality: {type:String , required:true},

    // Existing 'degree' field
    degree: {type:String , required:true},

    // Added 'university' field
    university: {type:String , required:true},

    experience: {type:String , required:true},

    about: {type:String , required:true},

    // Added 'mobile' field
    mobile: {type:String , required:true},

    available: {type:Boolean , default:true },

    address: {type:Object , required:true},

    date: {type:Number , required:true},

    slots_booked: {type:Object , default:{}},

}, {minimize:false});

const doctorModel = mongoose.models.doctor || mongoose.model('doctor' , doctorSchema);

export default doctorModel;
