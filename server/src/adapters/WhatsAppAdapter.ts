export class WhatsAppAdapter {
  public static formatResponse(matches: any[]): string {
    if (matches.length === 0) {
      return (
        "😔 Sorry, I couldn't find any matching government welfare schemes.\n\n" +
        "Please provide more profile details like:\n" +
        "• Age\n" +
        "• State\n" +
        "• Occupation\n" +
        "• Annual Income"
      );
    }

    let reply = "✅ *Top Matching Government Schemes (WhatsApp)*\n\n";

    matches.slice(0, 3).forEach((scheme, index) => {
      reply += `${index + 1}. *${scheme.scheme_name}*\n`;
      reply += `${scheme.summary || "Summary details not available."}\n`;
      reply += `🎯 Match Score: ${scheme.score}%\n`;
      if (scheme.official_link) {
        reply += `🔗 Links: ${scheme.official_link}\n`;
      }
      reply += "\n";
    });

    reply += "Reply with your details to query again!";
    return reply;
  }

  public static generateTwiML(replyText: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyText}</Message>
</Response>`;
  }
}
