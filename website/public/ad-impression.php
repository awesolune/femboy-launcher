<?php
declare(strict_types=1);
// Public endpoint. Its configuration, library and database live OUTSIDE public_html.
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');
function fail(int $code): void { http_response_code($code); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405);
if (($_SERVER['HTTP_ORIGIN'] ?? '') !== 'https://femboylauncher.ru') fail(403);
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') fail(415);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 512) fail(413);
$raw = file_get_contents('php://input', false, null, 0, 513);
if ($raw === false || strlen($raw) > 512) fail(413);
$body = json_decode($raw, true);
if (!is_array($body) || count($body) !== 2 || ($body['erid'] ?? '') !== 'MvGzQC9JbZnS6fV7CXrHCtaz' || !is_string($body['event_id'] ?? null)) fail(400);
$private = dirname(__DIR__) . '/.fl-ad-stats';
if (!is_file($private . '/enabled')) fail(503);
try {
    require_once $private . '/ad-stats-core.php';
    $lock = fopen($private . '/collector.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Unavailable');
    try {
        $db = fl_ad_db($private . '/impressions.sqlite');
        fl_ad_record($db, $body['event_id']);
        $month = (new DateTimeImmutable('now',new DateTimeZone('Europe/Moscow')))->format('Y-m');
        $report = fl_ad_report($db, $month);
        $stream = fopen('php://temp','r+');
        fputcsv($stream,['month','timezone','erid','impressions']);
        fputcsv($stream,[$month,'Europe/Moscow',FL_AD_ERID,$report['total']]);
        rewind($stream); $csv=stream_get_contents($stream); fclose($stream);
        $json = json_encode($report);
        if ($json === false) throw new RuntimeException('Report encoding failed');
        $data = [$month.'.json'=>$json, $month.'.csv'=>$csv];
        foreach ($data as $name=>$content) {
            if (file_put_contents($private.'/'.$name.'.tmp',$content) === false || !rename($private.'/'.$name.'.tmp',$private.'/'.$name)) throw new RuntimeException('Report unavailable');
        }
    } finally { flock($lock,LOCK_UN); fclose($lock); }
    http_response_code(204);
} catch (InvalidArgumentException $e) { fail(400); }
catch (Throwable $e) { fail(503); }
