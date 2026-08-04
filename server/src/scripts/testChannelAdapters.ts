import mongoose from "mongoose";
import dotenv from "dotenv";
import { processUnifiedPipeline } from "../services/communicationPipeline";
import { WhatsAppAdapter } from "../adapters/WhatsAppAdapter";
import { SMSAdapter } from "../adapters/SMSAdapter";
import { VoiceAdapter } from "../adapters/VoiceAdapter";
import { EmailAdapter } from "../adapters/EmailAdapter";
import CommunicationLog from "../models/CommunicationLog";
import User from "../models/user";

dotenv.config();

async function runTests() {
  console.log("🚀 Starting Multi-Channel Adapters & Pipeline Tests...");

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/setu-ai";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  // Create a mock user for identification test
  const testPhone = "+919999988888";
  const testEmail = "kamla.test@gmail.com";
  let testUserObj: any = null;

  try {
    await User.deleteOne({ email: testEmail });
    testUserObj = await User.create({
      name: "Kamla Devi",
      phone: testPhone,
      email: testEmail,
      age: "63",
      state: "Uttar Pradesh",
      occupation: "Farmer",
      income: "90000",
    });
    console.log("✅ Seeded test user: Kamla Devi");

    // Clean previous logs for this sender
    await CommunicationLog.deleteMany({ sender: { $in: [testPhone, testEmail] } });

    // Test 1: SMS Channel Pipeline
    console.log("\n--- TEST 1: SMS Adapter & Pipeline ---");
    const smsMessage = "I am a farmer from UP. Income is 90000. Widow.";
    const smsResult = await processUnifiedPipeline(smsMessage, "SMS", testPhone);
    
    console.log("Parsed Profile (SMS):", smsResult.profile);
    console.log("Matched Schemes Count (SMS):", smsResult.matches.length);
    console.log("User Identified (SMS):", smsResult.user ? "YES" : "NO");

    const smsReply = SMSAdapter.formatResponse(smsResult.matches);
    const smsTwiML = SMSAdapter.generateTwiML(smsReply);
    
    console.log("SMS Reply Preview:\n", smsReply);
    if (smsResult.matches.length > 0 && smsTwiML.includes("<Response>")) {
      console.log("🟢 TEST 1 PASSED: SMS adapter generated valid TwiML and resolved schemes.");
    } else {
      console.log("🔴 TEST 1 FAILED");
    }

    // Test 2: Voice Channel (IVR & Speech-to-Text Process)
    console.log("\n--- TEST 2: Voice Adapter & TwiML ---");
    const greetingTwiML = VoiceAdapter.generateGreeting();
    console.log("IVR Greeting TwiML generated:", greetingTwiML.includes("<Gather>") ? "PASS" : "FAIL");

    const voiceMessage = "I am 63 years old farmer from Uttar Pradesh";
    const voiceResult = await processUnifiedPipeline(voiceMessage, "Voice", testPhone);

    const voiceSpeech = VoiceAdapter.formatVoiceResponse(voiceResult.matches);
    const voiceTwiML = VoiceAdapter.generateTwiML(voiceSpeech);

    console.log("Voice TTS Speech Preview:\n", voiceSpeech);
    if (voiceTwiML.includes("<Say") && voiceTwiML.includes("<Hangup")) {
      console.log("🟢 TEST 2 PASSED: Voice adapter and speech TTS TwiML generated successfully.");
    } else {
      console.log("🔴 TEST 2 FAILED");
    }

    // Test 3: Email Channel Adapter
    console.log("\n--- TEST 3: Email Adapter & Parser ---");
    const emailBody = "Name: Kamla Devi\nAge: 63\nState: Uttar Pradesh\nOccupation: Farmer\nIncome: 90000";
    const emailResult = await processUnifiedPipeline(emailBody, "Email", testEmail);

    const emailResponseFields = EmailAdapter.formatEmailResponse(emailResult.matches, emailResult.profile);
    
    console.log("Email Subject:", emailResponseFields.subject);
    console.log("Email HTML Content length:", emailResponseFields.html.length);

    const emailSent = await EmailAdapter.sendMail(
      testEmail,
      emailResponseFields.subject,
      emailResponseFields.text,
      emailResponseFields.html,
      emailResult.user?._id
    );

    if (emailSent && emailResponseFields.html.includes("Setu AI Schemes Recommendations")) {
      console.log("🟢 TEST 3 PASSED: Inbound email parsed, matches retrieved, and outbound mock sent.");
    } else {
      console.log("🔴 TEST 3 FAILED");
    }

    // Test 4: Unified Conversation History (Context stitching)
    console.log("\n--- TEST 4: Unified Context Stitching ---");
    // User sends partial info first
    const cleanPhone = testPhone;
    await CommunicationLog.deleteMany({ sender: cleanPhone });

    console.log("User sends part 1: 'I am a 63 years old farmer.'");
    await processUnifiedPipeline("I am a 63 years old farmer.", "WhatsApp", cleanPhone);

    console.log("User sends part 2: 'Also, I am from Uttar Pradesh.'");
    const step2Result = await processUnifiedPipeline("Also, I am from Uttar Pradesh.", "WhatsApp", cleanPhone);

    console.log("Cumulative Parsed Profile:", step2Result.profile);
    if (step2Result.profile.age === 63 && step2Result.profile.state === "Uttar Pradesh") {
      console.log("🟢 TEST 4 PASSED: Unified Context stitched conversation history across turns successfully!");
    } else {
      console.log("🔴 TEST 4 FAILED: Profile context lost between turns.");
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    if (testUserObj) {
      await User.deleteOne({ _id: testUserObj._id });
    }
    await CommunicationLog.deleteMany({ sender: { $in: [testPhone, testEmail] } });
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

runTests();
