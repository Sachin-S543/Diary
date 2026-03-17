// Inkrypt — Tauri v2 entry point
// Copyright (C) 2025 Sachin-S543 — AGPL-3.0-or-later

// Prevents an additional console window from appearing on Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
