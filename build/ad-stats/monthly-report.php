<?php
declare(strict_types=1);
// Run via PHP CLI, never expose this report over HTTP.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/ad-stats-core.php';
if ($argc !== 3 || !is_file($argv[1])) { fwrite(STDERR,"Usage: php monthly-report.php /private/impressions.sqlite YYYY-MM\n"); exit(1); }
$db = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('PRAGMA query_only=ON');
try { $report = fl_ad_report($db, $argv[2]); }
catch (Throwable $e) { fwrite(STDERR,"Report failed; no fabricated zero report was produced.\n"); exit(1); }
fputcsv(STDOUT,['month','timezone','erid','impressions']);
fputcsv(STDOUT,[$report['month'],$report['timezone'],$report['erid'],$report['total']]);
fwrite(STDERR,json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n");
