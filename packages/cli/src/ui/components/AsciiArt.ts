/**
 * @license
 * Copyright 2026 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Full-color large banner — shown when terminal width >= ~100 cols.
 * Original block-letter design. Width: ~96 chars.
 */
export const fullAsciiLogo = `
  ________  ______  ____  ____     _____ ____  ___    ____  __ __
 /_  __/ / / / __ \\/ __ )/ __ \\   / ___// __ \\/   |  / __ \\/ //_/
  / / / / / / /_/ / __  / / / /   \\__ \\/ /_/ / /| | / /_/ / ,<   
 / / / /_/ / _, _/ /_/ / /_/ /   ___/ / ____/ ___ |/ _, _/ /| |  
/_/  \\____/_/ |_/_____/\\____/   /____/_/   /_/  |_/_/ |_/_/ |_|  
`;

/**
 * Compact banner — shown when terminal width is 60–99 cols.
 * Slimmer two-line style. Width: ~48 chars.
 */
export const shortAsciiLogo = `
 ________  _____  ___  ____    _______  ___   ___  __ __
/_  __/ / / / _ \\/ _ )/ __ \\  / __/ _ \\/ _ | / _ \\/ //_/
 / / / /_/ / , _/ _  / /_/ / _\\ \\/ ___/ __ |/ , _/ ,<   
/_/  \\____/_/|_/____/\\____/ /___/_/  /_/ |_/_/|_/_/|_|  
`;

/**
 * Monochrome / no-color fallback — shown when colors are unsupported
 * or terminal is very narrow. Width: ~32 chars.
 */
export const monoAsciiLogo = `
╔══════════════════════════════╗
║  🔥  T U R B O  S P A R K   ║
╚══════════════════════════════╝
`;
