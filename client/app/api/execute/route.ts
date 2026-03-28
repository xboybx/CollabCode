import { NextResponse } from "next/server";

export async function POST(req: Request) {

    const WANDBOX_API = 'https://wandbox.org/api/compile.json';

    // Wandbox compiler names (verified from https://wandbox.org/api/list.json)
    const WANDBOX_LANGUAGE_MAP: Record<string, { compiler: string; filename: string }> = {
        javascript: { compiler: 'nodejs-20.17.0', filename: 'prog.js' },
        typescript: { compiler: 'typescript-5.6.2', filename: 'prog.ts' },
        python: { compiler: 'cpython-3.12.7', filename: 'prog.py' },
        java: { compiler: 'openjdk-jdk-22+36', filename: 'prog.java' },
        cpp: { compiler: 'gcc-13.2.0', filename: 'prog.cc' },
        go: { compiler: 'go-1.23.2', filename: 'prog.go' },
        rust: { compiler: 'rust-1.82.0', filename: 'prog.rs' },
        csharp: { compiler: 'dotnetcore-8.0.402', filename: 'prog.cs' },
        php: { compiler: 'php-8.3.12', filename: 'prog.php' },
    };

    try {
        const body = await req.json()
        const { code, language } = body;

        console.log("--- BACKEND DATA RECEIVED ---", JSON.stringify(body));

        if (!code || !language) {
            return NextResponse.json({
                success: false,
                error: "Code and Language are required",
                received: { codeType: typeof code, langType: typeof language }
            }, { status: 400 });
        }

        const langcompiler = WANDBOX_LANGUAGE_MAP[language];

        if (!langcompiler) {
            console.warn(`[EXECUTION] Unsupported language: ${language}`);
            return NextResponse.json({ success: false, error: `Language ${language} is not supported for execution yet.` }, { status: 400 });
        }

        /* wandbox api call */

        const response = await fetch(WANDBOX_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                compiler: langcompiler.compiler,
                filename: langcompiler.filename,
                code,
                save: false,
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Wandbox API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
            });
            throw new Error(`Execution engine returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const output = data.program_output || "";
        const compilerError = data.compiler_error || "";
        const programError = data.program_error || "";
        const error = compilerError || programError || null;

        return NextResponse.json({
            success: true,
            output: output || (error ? null : "No output"),
            error: error || null,
            language,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Execution error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'System failed to execute code' },
            { status: 500 }
        );
    }
}