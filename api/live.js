export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        ok: false,
        message: "TWELVE_DATA_API_KEY tanımlı değil."
      });
    }

    const goldUrl =
      `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1min&outputsize=1&apikey=${apiKey}`;
    const usdUrl =
      `https://api.twelvedata.com/time_series?symbol=USD/TRY&interval=1min&outputsize=1&apikey=${apiKey}`;

    const [goldResp, usdResp] = await Promise.all([
      fetch(goldUrl),
      fetch(usdUrl)
    ]);

    const goldJson = await goldResp.json();
    const usdJson = await usdResp.json();

    if (goldJson.status === "error") {
      return res.status(200).json({
        ok: false,
        message: "Ons verisi hatası: " + (goldJson.message || "bilinmeyen hata"),
        raw: goldJson
      });
    }

    if (usdJson.status === "error") {
      return res.status(200).json({
        ok: false,
        message: "USD/TRY verisi hatası: " + (usdJson.message || "bilinmeyen hata"),
        raw: usdJson
      });
    }

    const goldRow = goldJson.values && goldJson.values[0];
    const usdRow = usdJson.values && usdJson.values[0];

    if (!goldRow || !usdRow) {
      return res.status(200).json({
        ok: false,
        message: "Veri satırı bulunamadı.",
        goldJson,
        usdJson
      });
    }

    const goldUsdOunce = Number(goldRow.close);
    const usdTry = Number(usdRow.close);

    if (Number.isNaN(goldUsdOunce) || Number.isNaN(usdTry)) {
      return res.status(200).json({
        ok: false,
        message: "Sayı dönüştürme hatası.",
        goldClose: goldRow.close,
        usdClose: usdRow.close
      });
    }

    const gramTryRef = Number(
      ((goldUsdOunce * usdTry) / 31.1034768).toFixed(2)
    );

    return res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      marketTime: {
        xauusd: goldRow.datetime || null,
        usdtry: usdRow.datetime || null
      },
      goldUsdOunce,
      usdTry,
      gramTryRef,
      source: {
        provider: "Twelve Data",
        xauusd: "XAU/USD 1min",
        usdtry: "USD/TRY 1min"
      }
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      message: "Sunucu hatası: " + (error.message || "bilinmeyen hata")
    });
  }
}
