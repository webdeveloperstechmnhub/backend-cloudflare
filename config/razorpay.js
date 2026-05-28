const toBasicAuth = (keyId, keySecret) => {
  const value = `${keyId}:${keySecret}`;
  return `Basic ${Buffer.from(value).toString("base64")}`;
};

const createOrder = async (payload) => {
  const keyId = process.env.RAZORPAY_KEY;
  const keySecret = process.env.RAZORPAY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: toBasicAuth(keyId, keySecret),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.description || data.error?.reason || "Razorpay order creation failed");
  }

  return data;
};

module.exports = {
  orders: {
    create: createOrder,
  },
};
