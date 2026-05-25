// Vercel serverless function - CommonJS format
export default function handler(req, res) {
  return res.status(200).json({
    ok: true,
    config: {
      supabase: {
        configured: false,
        url: "",
        anonKey: ""
      },
      pricingPlans: []
    }
  });
}
