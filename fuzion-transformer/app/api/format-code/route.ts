import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Format code API called")

    const { code } = await request.json()

    if (!code) {
      console.log("[v0] No code provided")
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    console.log("[v0] Formatting code, length:", code.length)

    const beautifyModule = await import("js-beautify")
    console.log("[v0] Beautify module keys:", Object.keys(beautifyModule))

    // Try different access patterns to find the correct one
    const beautifyFn =
      beautifyModule.js || beautifyModule.js_beautify || beautifyModule.default?.js || beautifyModule.default

    if (typeof beautifyFn !== "function") {
      console.error("[v0] Could not find beautify function, module structure:", beautifyModule)
      throw new Error("js-beautify function not found in module")
    }

    const formatted = beautifyFn(code, {
      indent_size: 2,
      indent_char: " ",
      max_preserve_newlines: 2,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      indent_scripts: "normal",
      brace_style: "collapse",
      space_before_conditional: true,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: true,
      wrap_line_length: 0,
      indent_inner_html: false,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false,
    })

    console.log("[v0] Code formatted successfully")
    return NextResponse.json({ formatted })
  } catch (error) {
    console.error("[v0] Format error:", error)
    return NextResponse.json(
      {
        error: "Failed to format code",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
