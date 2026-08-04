export class SMSAdapter {
  public static formatResponse(matches: any[]): string {
    if (matches.length === 0) {
      return (
        "Setu AI: No matching schemes found. " +
        "Try replying with your Age, State, Occupation, and Income."
      );
    }

    let reply = "Setu AI: Top Matches:\n\n";

    // Slice to top 2 for SMS character efficiency
    matches.slice(0, 2).forEach((scheme, index) => {
      reply += `${index + 1}. ${scheme.scheme_name}\n`;
      reply += `Score: ${scheme.score}%\n`;
      if (scheme.official_link) {
        reply += `Link: ${scheme.official_link}\n`;
      }
      reply += "\n";
    });

    return reply.trim();
  }

  public static generateTwiML(replyText: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyText}</Message>
</Response>`;
  }
}
