# Translation System

This dashboard uses JSON files for translations. Each language has its own JSON file in this directory.

## Available Languages

- **en.json** - English (default)
- **ru.json** - Russian

## How It Works

1. The dashboard loads the appropriate translation file based on the selected language
2. All text in the interface uses translation keys that are looked up in the JSON file
3. When you switch languages using the ENG/РУС buttons, the dashboard reloads the new translation file

## Adding or Updating Translations

### To Update Existing Translations

1. Open the language file you want to edit (e.g., `ru.json` for Russian)
2. Find the key you want to translate
3. Update the value (the text after the colon)
4. Save the file
5. Refresh the dashboard in your browser

### Example

```json
{
  "dashboard": "Dashboard",
  "units": "Units",
  "totalPower": "Total Power"
}
```

To translate to Russian:

```json
{
  "dashboard": "Панель",
  "units": "Установки",
  "totalPower": "Общая мощность"
}
```

### To Add a New Language

1. Copy `en.json` to a new file (e.g., `de.json` for German)
2. Translate all the values in the new file
3. Update the language switcher in `index.html` to include your new language button
4. Add your language code to the language switcher logic in `app.js`

## Translation Keys

The JSON file uses flat keys for simplicity. Each key corresponds to a specific piece of text in the interface:

- **Navigation**: `dashboard`, `units`, `analyse`, `management`, `help`
- **Dashboard**: `totalUnits`, `totalPower`, `running`, `standby`, `warning`
- **Units**: `unitDetails`, `basicInfo`, `liveValues`, `selectUnit`
- **Common**: `close`, `refresh`, `status`, `location`

## Tips

- Keep translation keys consistent across all language files
- If you add a new key to one language, add it to all languages
- Use the same JSON structure in all language files
- Test your translations by switching languages in the dashboard
- The English file (`en.json`) is the reference - use it as a template

## Fallback Behavior

If a translation key is not found:
- The system will display the key itself (e.g., "dashboard" if not translated)
- If a language file fails to load, it falls back to English
