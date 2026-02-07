export const USAGE_TABLE = "vh-faq-agent-usage";
export const TRANSCRIPTION_BUCKET = "vh-faq-agent-transcriptions";
export const AGENT_IDENTIFIER = "vh-faq-agent";
export const DAILY_LIMIT_MINUTES = 100; //Set higher due to bug. Right now for each llm_node call send duration of minutes to api. Api adds received duration in existing duration. So if llm_node called 5 times during 5 minutes then the duration could be 15 minutes!
export const TTL_HOURS = 16;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};
