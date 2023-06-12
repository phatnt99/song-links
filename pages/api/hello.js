// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import checkEngine from "@/utils/engine";

export default async function handler(req, res) {
  const { keyword } = req.query;
  let rest = await checkEngine.isValidSongName(keyword);
  res.status(200).json({data: rest});
}
