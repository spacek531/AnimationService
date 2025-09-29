/**
 * Specifies whether the current build is for production or development environment.
 */
type BuildConfiguration = "production" | "development";


/**
 * The current active build configuration.
 */
declare const __BUILD_CONFIGURATION__: BuildConfiguration;


/**
 * Returns true if the current build is a production build.
 */
declare const isProduction: boolean;


/**
 * Returns true if the current build is a production build.
 */
declare const isDevelopment: boolean;


/**
 * Returns true if the UI is available, or false if the game is running in headless mode.
 */
declare const isUiAvailable: boolean;


/**
 * Returns true if the player is in a multiplayer server, or false if it is a singleplayer game.
 */
declare function isMultiplayer(): boolean;