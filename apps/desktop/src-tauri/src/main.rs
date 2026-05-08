#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, GlobalShortcutManager, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("open", "Open Global Notes"))
        .add_item(CustomMenuItem::new("quit", "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                match id.as_str() {
                    "open" => toggle_window(app),
                    "quit" => std::process::exit(0),
                    _ => {}
                }
            }
        })
        .setup(|app| {
            let app_handle = app.handle();

            // Hide from dock/taskbar (macOS)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Register global hotkey: Cmd+Shift+N (macOS) / Ctrl+Shift+N (Windows/Linux)
            #[cfg(target_os = "macos")]
            let shortcut = "Cmd+Shift+N";
            #[cfg(not(target_os = "macos"))]
            let shortcut = "Ctrl+Shift+N";

            app_handle
                .global_shortcut_manager()
                .register(shortcut, move || {
                    toggle_window(&app_handle);
                })
                .expect("Failed to register global shortcut");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error running tauri app");
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_window("capture") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.center();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}
