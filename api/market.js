function round(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        ok: false,
        message: "TWELVE_DATA_API_KEY tanımlı değil."
      });
    }

    const [goldResp, usdResp] = await Promise.all([
      fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${apiKey}`),
      fetch(`https://api.twelvedata.com/price?symbol=USD/TRY&apikey=${apiKey}`)
    ]);

    const goldJson = await goldResp.json();
    const usdJson = await usdResp.json();

    let goldUsdOunce = Number(goldJson.price);
    let usdTry = Number(usdJson.price);

    // fallback
    if (!goldUsdOunce || !usdTry || Number.isNaN(goldUsdOunce) || Number.isNaN(usdTry)) {
      goldUsdOunce = 2320;
      usdTry = 32.5;
    }

    const ref = round((goldUsdOunce * usdTry) / 31.1034768);

    const kapalicarsiBuy = round(ref * 0.9875);
    const kapalicarsiSell = round(ref * 1.0025);

    const bankaBuy = round(ref * 0.9780);
    const bankaSell = round(ref * 1.0140);

    const kapaliSpread = round(kapalicarsiSell - kapalicarsiBuy);
    const bankaSpread = round(bankaSell - bankaBuy);

    const advantageTl = round(bankaSell - kapalicarsiSell);

    let bestPlace = "Karşılaştır";
    let summary = "İki tarafı da kontrol ederek alım yapmak daha doğru olabilir.";
    let status = "normal";

    if (kapalicarsiSell < bankaSell) {
      bestPlace = "Kapalıçarşı";
      status = "kapali";
      summary = `Kapalıçarşı satış tarafı bankalara göre yaklaşık ${advantageTl} TL daha uygun görünüyor.`;
    } else if (bankaSell < kapalicarsiSell) {
      bestPlace = "Banka";
      status = "banka";
      summary = `Banka satış tarafı Kapalıçarşı'ya göre yaklaşık ${Math.abs(advantageTl)} TL daha uygun görünüyor.`;
    }

    return res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      source: "A Modeli (yaklaşık makas)",
      referenceGram: ref,
      kapalicarsi: {
        buy: kapalicarsiBuy,
        sell: kapalicarsiSell,
        spread: kapaliSpread
      },
      banka: {
        buy: bankaBuy,
        sell: bankaSell,
        spread: bankaSpread
      },
      advantageTl,
      bestPlace,
      status,
      summary,
      notes: [
        "Bu katman beta amaçlı yaklaşık makas modeli kullanır.",
        "Gerçek Kapalıçarşı ve banka verisi bir sonraki aşamada eklenecektir."
      ]
    });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      message: "Market API hatası: " + (err.message || "bilinmeyen hata")
    });
  }
}
