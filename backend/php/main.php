<?php
include "Config.php";

$port = Config::port + 1;

echo "PHP " . phpversion() . " Development Server started at " . date("Y-m-d H:i:s") . "\n";
echo "Listening on http://0.0.0.0:" . $port . "/\n";
echo "Press Ctrl-C to quit.\n";
exec("php -S 0.0.0.0:" . $port);
