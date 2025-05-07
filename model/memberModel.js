import mongoose from "mongoose";


const propertyDetailsSchema = new mongoose.Schema({
   projectName: { type: String, required: true },
   plotNumber: { type: String, required: true },
   dimension: {
     length: { type: Number, required: true },
     breadth: { type: Number, required: true },
   },
   pricePerSqft: { type: Number, required: true },
   propertyCost: { type: Number, required: true }
 });

const memberSchema =new mongoose.Schema({
     refname:{
        type:String,
        required:true
     },
       rankDesignation:{
        type:String,
        required:true
     },
       serviceId :{
        type:String,
        required:true
       },
       relationship:{
        type:String,
        required:true
       },
         saluation:{
        type:String,    
        required:true
       },
       propertyDetails: {
         type: propertyDetailsSchema,
         required: true
       },
         name:{
            type:String,
            required:true
         },
         mobileNumber:{
            type:Number,
            required:true
         },
         AlternativeNumber:{
            type:Number,
            required:true
         },
         email:{
            type:String,
            required:true
         },
         dateofbirth:{
            type:Date,
            required:true
         },
          fatherName:{
            type:String,
            required:true
         },
           contactAddress:{
            type:String,
            required:true
         },
           permanentAddress:{
            type:String,
            required:true
           },
           workingAddress:{
            type:String,
            required:true
           },
           MemberPhoto:{
            type:String,
           },
           MemberSign:{
            type:String,
           },
           nomineeName:{
            type:String,
            required:true
           },
           nomineeAge:{
            type:Number,
            required:true
           },
           nomineeRelation:{
            type:String,
            required:true
           },
           nomineeAddress:{
            type:String,
            required:true
           },
           SeniorityID:{
            type:String,
            required:true
           },
           MembershipNo:{
            type:String,
            required:true
           },
           ConfirmationLetterNo:{
            type:String,
            required:true
           },
           ShareCertificateNumber:{
            type:String,
            required:true
           },
           ReceiptNo:{
            type:String,
            required:true
           },
           date:{
            type:Date,
            required:true
           },
           NoofShares:{
            type:Number,
            required:true
           },
           ShareFee:{
            type:Number,
            required:true
           },
           MembershipFee:{
            type:Number,
            required:true
           },
           ApplicationFee:{
            type:Number,
            required:true
           },
           AdmissionFee:{
            type:Number,
            required:true
           },
           MiscellaneousExpenses:{
            type:Number,
            required:true
           },
           PaymentType:{
            type:String,
            required:true
           },
           PaymentMode:{
            type:String,
            required:true
           },
           BankName:{
            type:String,
            required:true
           },
           BranchName:{
            type:String,
            required:true
           },
           Amount:{
            type:Number,
            required:true
           },
         //   DDNumber:{
         //    type:String,
         //    required:true
         //   }

})

const Member = mongoose.model("Member",memberSchema)
export default Member;