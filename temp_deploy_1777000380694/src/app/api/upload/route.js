import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const fileExtension = file.name.split('.').pop();
        const filename = `${randomUUID()}.${fileExtension}`;
        
        // Define path
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
        const path = join(uploadDir, filename);

        // Write file
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path, buffer);
        
        const publicPath = `/uploads/avatars/${filename}`;

        return NextResponse.json({ 
            message: 'File uploaded successfully',
            url: publicPath
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
