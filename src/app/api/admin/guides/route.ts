import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Đường dẫn file lưu trữ trên Server
const dataFilePath = path.join(process.cwd(), 'data', 'guides.json');

// Hàm đọc dữ liệu
const readData = () => {
  try {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'));
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify({ guides: [], prompts: [] }));
    }
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { guides: [], prompts: [] };
  }
};

// GET: Lấy danh sách Hướng dẫn & Prompts
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

// POST: Lưu danh sách mới (Dành cho Admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true, message: 'Đã lưu thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi khi lưu dữ liệu' }, { status: 500 });
  }
}