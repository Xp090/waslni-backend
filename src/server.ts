import errorHandler from "errorhandler";

import app from "./app";
import {initSocket} from "./socket/connection";
import {GoogleMapsUtils} from "./util/google-maps-utils";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    console.log(
        "  App is running at http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );
    console.log("  Press CTRL-C to stop\n");
});
initSocket(server);
export default server;
