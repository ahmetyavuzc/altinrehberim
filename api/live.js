let cache = {
  data: null,
  time: 0
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const now = Date.now();

  // 60 saniye cache
  if (cache.data && now - cache.time < 60000) {
    return res.status(200).json(cache.data);
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  try {
    const [goldResp, usdResp] = await Promise.all([
      fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${apiKey}`),
      fetch(`https://api.twelvedata.com/price?symbol=USD/TRY&apikey=${apiKey}`)
    ]);

    const goldJson = await goldResp.json();
    const usdJson = await usdResp.json();

    let goldUsdOunce = Number(goldJson.price);
    let usdTry = Number(usdJson.price);

    // 🔥 fallback (API limit gelirse burası çalışır)
    if (!goldUsdOunce || !usdTry) {
      goldUsdOunce = 2320; // gerçekçi fallback
      usdTry = 32.5;

      const fallbackData = {
        ok: true,
        fallback: true,
        updatedAt: new Date().toISOString(),
        goldUsdOunce,
        usdTry,
        gramTryRef: Number(((goldUsdOunce * usdTry) / 31.103).toFixed(2)),
        source: "Fallback (API limit)"
      };

      cache = { data: fallbackData, time: now };
      return res.status(200).json(fallbackData);
    }

    const data = {
      ok: true,
      updatedAt: new Date().toISOString(),
      goldUsdOunce,
      usdTry,
      gramTryRef: Number(((goldUsdOunce * usdTry) / 31.103).toFixed(2)),
      source: "TwelveData"
    };

    cache = { data, time: now };

    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({
      ok: false,
      message: "API hatası ama sistem çalışıyor"
    });
  }
}
