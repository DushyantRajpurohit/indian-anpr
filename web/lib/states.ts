// Registration state/UT codes the corrector accepts (anpr/plate.py STATES), with the names they stand for.
export const STATE_NAMES: Record<string, string> = {
  AN: "Andaman & Nicobar", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar",
  CG: "Chhattisgarh", CH: "Chandigarh", CT: "Chhattisgarh (old)", DD: "Daman & Diu", DL: "Delhi",
  DN: "Dadra & Nagar Haveli", GA: "Goa", GJ: "Gujarat", HP: "Himachal Pradesh", HR: "Haryana",
  JH: "Jharkhand", JK: "Jammu & Kashmir", KA: "Karnataka", KL: "Kerala", LA: "Ladakh",
  LD: "Lakshadweep", MH: "Maharashtra", ML: "Meghalaya", MN: "Manipur", MP: "Madhya Pradesh",
  MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", OR: "Odisha (old)", PB: "Punjab", PY: "Puducherry",
  RJ: "Rajasthan", SK: "Sikkim", TG: "Telangana", TN: "Tamil Nadu", TR: "Tripura", TS: "Telangana (old)",
  UA: "Uttarakhand (old)", UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal",
};

export const partName = (parts: string[], i: number) =>
  parts[1] === "BH"
    ? ["Year of registration", "Bharat series", "Number", "Category"][i]
    : i === 0 ? STATE_NAMES[parts[0]] ?? "State" : ["", "District", "Series", "Number"][i];
