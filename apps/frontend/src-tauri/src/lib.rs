// Inkrypt — Tauri v2 library root
// Copyright (C) 2025 Sachin-S543 — AGPL-3.0-or-later

use tauri::Manager;

/// All custom Tauri commands live here.
/// Commands are invoked from the frontend via `invoke()`.

/// Returns the current app version from Cargo.toml.
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Opens a URL in the system default browser.
#[tauri::command]
async fn open_in_browser(url: String) -> Result<(), String> {
    open::that(url).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // On startup, focus the main window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            open_in_browser,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Inkrypt");
}
