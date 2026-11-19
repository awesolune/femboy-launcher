<?php
declare(strict_types=1);
const FL_AD_ERID = 'MvGzQC9JbZnS6fV7CXrHCtaz';
function fl_ad_db(string $file): PDO {
    $db = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('CREATE TABLE IF NOT EXISTS impressions (event_id TEXT PRIMARY KEY, erid TEXT NOT NULL, day TEXT NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS impressions_day ON impressions(day)');
    return $db;
}
function fl_ad_record(PDO $db, string $id, ?DateTimeImmutable $time = null): bool {
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D', $id)) throw new InvalidArgumentException('Invalid event');
    $day = ($time ?? new DateTimeImmutable('now'))->setTimezone(new DateTimeZone('Europe/Moscow'))->format('Y-m-d');
    $q = $db->prepare('INSERT OR IGNORE INTO impressions(event_id,erid,day) VALUES (?,?,?)');
    $q->execute([$id, FL_AD_ERID, $day]);
    return $q->rowCount() === 1;
}
function fl_ad_report(PDO $db, string $month): array {
    if (!preg_match('/^20[0-9]{2}-(0[1-9]|1[0-2])$/D', $month)) throw new InvalidArgumentException('Invalid month');
    $q = $db->prepare('SELECT day,COUNT(*) AS impressions FROM impressions WHERE day LIKE ? GROUP BY day ORDER BY day');
    $q->execute([$month . '-%']);
    $days = $q->fetchAll(PDO::FETCH_ASSOC);
    return ['month'=>$month,'timezone'=>'Europe/Moscow','erid'=>FL_AD_ERID,'total'=>array_sum(array_column($days,'impressions')),'days'=>$days];
}
