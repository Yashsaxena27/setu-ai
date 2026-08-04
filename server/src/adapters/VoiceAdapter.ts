export class VoiceAdapter {
  public static generateGreeting(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-IN" voice="Google.en-IN-Wavenet-A">
    Welcome to Setu A.I. Government Scheme Helpline. 
    Please speak your profile details clearly, such as your age, state, occupation, and annual income.
  </Say>
  <Gather input="speech" action="/whatsapp/voice/process" speechTimeout="auto" language="en-IN">
    <Say language="en-IN" voice="Google.en-IN-Wavenet-A">Please speak now.</Say>
  </Gather>
  <Redirect>/whatsapp/voice/timeout</Redirect>
</Response>`;
  }

  public static generateRepeatPrompt(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-IN" voice="Google.en-IN-Wavenet-A">
    Sorry, I did not catch your details. Could you please repeat your age, state, occupation, and income?
  </Say>
  <Gather input="speech" action="/whatsapp/voice/process" speechTimeout="auto" language="en-IN">
    <Say language="en-IN" voice="Google.en-IN-Wavenet-A">Please speak now.</Say>
  </Gather>
  <Redirect>/whatsapp/voice/timeout</Redirect>
</Response>`;
  }

  public static formatVoiceResponse(matches: any[]): string {
    if (matches.length === 0) {
      return (
        "I was unable to find any matching schemes for your profile. " +
        "Please visit the official government website for comprehensive scheme listings."
      );
    }

    let speech = "I found matching schemes for your profile. ";

    matches.slice(0, 2).forEach((scheme, index) => {
      speech += `Number ${index + 1}: ${scheme.scheme_name}. `;
      if (scheme.summary) {
        // Strip URLs or long terms to keep speech smooth
        const cleanSummary = scheme.summary.replace(/https?:\/\/\S+/g, "").substring(0, 150);
        speech += `${cleanSummary}. `;
      }
      speech += `This scheme has a match score of ${scheme.score} percent. `;
    });

    speech += "Thank you for calling Setu A.I. Have a wonderful day. Goodbye!";
    return speech;
  }

  public static generateTwiML(speechText: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-IN" voice="Google.en-IN-Wavenet-A">${speechText}</Say>
  <Hangup />
</Response>`;
  }
}
