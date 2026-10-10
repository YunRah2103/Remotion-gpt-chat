#!/usr/bin/env python3
"""Verify authorized yt-dlp bundles and prepare Agent A's private selection scaffold.

An imported source is NOT verified Porsche footage. This never fetches, reencodes,
uploads, grants rights or auto-populates claimed Turbo identity/unique shots.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

GENERATIONS = ['930']*4 + ['964']*4 + ['993']*4 + ['996']*4 + ['997']*4 + ['991']*5 + ['992']*5

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024*1024), b''):
            h.update(block)
    return h.hexdigest()

def within(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not name or Path(name).is_absolute() or '..' in Path(name).parts:
        raise ValueError('source path must be relative and cannot escape the import directory')
    p = (root / name).resolve()
    if not p.is_relative_to(root.resolve()) or not p.is_file():
        raise ValueError('download source missing or unsafe: ' + name)
    return p

def build_inventory(roots: list[Path]) -> dict:
    sources, identifiers = [], set()
    for root in roots:
        root = root.resolve()
        if not root.is_dir():
            raise ValueError('missing import directory: ' + str(root))
        reports = sorted(root.rglob('*.qa.json'))
        if not reports:
            raise ValueError('no yt-dlp quality report files in ' + str(root))
        for report in reports:
            q = json.loads(report.read_text(encoding='utf-8'))
            if q.get('status') != 'PASS' or q.get('fullVideoDecode') != 'PASS':
                raise ValueError('source did not pass native decode and quality checks: '+str(report))
            if q.get('policy',{}).get('reencoded') is not False or q['policy'].get('upscaled') is not False:
                raise ValueError('importer report claims transcoding or upscaling')
            probe = q.get('probe', {})
            p = within(root, probe.get('file'))
            actual = digest(p)
            if actual.lower() != q.get('sourceFileSha256','').lower():
                raise ValueError('original source SHA256 mismatch: '+str(p))
            if int(probe.get('width') or 0) < 480 or int(probe.get('height') or 0) < 360 or float(probe.get('fps') or 0) < 20:
                raise ValueError('source fails Agent A dimensions/FPS minimum')
            if p.stat().st_size != probe.get('bytes'):
                raise ValueError('source size changed since downloader report')
            url = q.get('sourceUrl', '')
            parsed = urlparse(url)
            if parsed.scheme != 'https' or parsed.hostname not in {'www.youtube.com','youtube.com','youtu.be'}:
                raise ValueError('untrusted YouTube source URL in QA: '+str(report))
            if actual in identifiers:
                raise ValueError('duplicate original source media bytes across imports')
            identifiers.add(actual)
            sources.append({
                'sourceId':actual[:16], 'sourceFileSha256':actual,
                'absolutePath':str(p), 'sourceUrl':url,
                'width':probe['width'], 'height':probe['height'], 'fps':probe['fps'],
                'durationSeconds':probe['durationSeconds'],
                'fileBytes':p.stat().st_size, 'videoCodec':probe.get('videoCodec'),
                'title':'', 'creator':'', 'rightsStatus':'REVIEW_REQUIRED',
                'shotReviewStatus':'NOT_STARTED'
            })
    return {
        'schemaVersion':1, 'status':'SOURCE_FILES_VERIFIED_NOT_SHOTS',
        'importedSources':len(sources), 'verifiedUniquePorscheShots':0,
        'note':'Car model, Turbo identity, rights, and individual camera setups require human review.',
        'sources':sources
    }

def build_selection_template(beat_map: dict, inventory: dict) -> dict:
    cuts = beat_map.get('cuts', [])
    if len(cuts) != 30 or beat_map.get('output', {}).get('frames') != 510:
        raise ValueError('expected 30 cuts / 510 frames in Porsche beat-map')
    shots = []
    for i,c in enumerate(cuts):
        if c['slot'] != i+1 or c['generation'] != GENERATIONS[i]:
            raise ValueError('beat-map chronology error')
        shots.append({
            'slot':i+1, 'generation':c['generation'],
            'sourceId':None, 'localPath':None, 'shotKey':None, 'visualFingerprint':None,
            'sourceUrl':None, 'originCreator':None, 'sourceLicenseStatus':'unknown',
            'sha256':None, 'width':None, 'height':None, 'fps':None,
            'sourceInSeconds':None, 'sourceOutSeconds':None,
            'angleAndMotion':None, 'actualTurboIdentityEvidence':None,
            'verifiedMovingVideo':False, 'uniqueAngleVerified':False,
            'motionEvidence':None, 'sourceTransferArtifact':None
        })
    return {
        'schemaVersion':1, 'status':'INCOMPLETE_MANUAL_SELECTION',
        'sourceInventory':inventory['importedSources'],
        'note':'Fill fields only after reviewing actual moving Turbo camera angles, then run Agent A audit.',
        'shots':shots
    }

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--import-root', type=Path, action='append', required=True)
    p.add_argument('--beat-map', type=Path, required=True)
    p.add_argument('--inventory-output', type=Path, required=True)
    p.add_argument('--selection-output', type=Path, required=True)
    args = p.parse_args()
    inventory = build_inventory(args.import_root)
    cuts = json.loads(args.beat_map.read_text(encoding='utf-8'))
    selection = build_selection_template(cuts, inventory)
    for path, data in [(args.inventory_output, inventory), (args.selection_output, selection)]:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({
        'status':inventory['status'], 'importedSources':inventory['importedSources'],
        'verifiedPorscheShots':0, 'inventoryFile':str(args.inventory_output),
        'selectionFile':str(args.selection_output)
    }, indent=2))

if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as error:
        raise SystemExit('IMPORT_BLOCKED: '+str(error))
