"""Dependency-free source/API-contract checks (not a live integration test)."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files={
 'controller':root/'backend/src/main/java/com/timecapsule/profile/controller/ProfileController.java',
 'dto':root/'backend/src/main/java/com/timecapsule/profile/dto/ProfileUpdateRequest.java',
 'model':root/'backend/src/main/java/com/timecapsule/profile/model/UserProfile.java',
 'route':root/'frontend/app/api/profile/[userId]/route.ts',
 'page':root/'frontend/app/profile/page.tsx',
}
s={k:v.read_text() for k,v in files.items()}
tests={
 'GET profile endpoint':'@GetMapping("/{userId}")' in s['controller'],
 'PUT profile endpoint':'@PutMapping("/{userId}")' in s['controller'],
 'Missing user returns 404':'HttpStatus.NOT_FOUND' in s['controller'],
 'Duplicate username returns 409':'HttpStatus.CONFLICT' in s['controller'],
 'Invalid avatar returns 400':'HttpStatus.BAD_REQUEST' in s['controller'],
 'Username required and length-limited':'@NotBlank @Size(max=50)' in s['dto'],
 'Bio limited to 500 characters':'@Size(max=500) String bio' in s['dto'],
 'Avatar URL limited':'@Size(max=2048) String avatarUrl' in s['dto'],
 'Database entity and table':'@Entity @Table(name="user_profiles")' in s['model'],
 'Next.js GET/PUT proxy':all(x in s['route'] for x in ['export async function GET','export async function PUT']),
 'Frontend fetches profile':"fetch('/api/profile/1')" in s['page'],
 'Frontend saves edits':'method:\'PUT\'' in s['page'],
 'Frontend renders saved avatar':'className="profile-photo" src={profile.avatarUrl}' in s['page'],
}
for name,ok in tests.items():print(('PASS' if ok else 'FAIL')+'  '+name)
print(f'\n{sum(tests.values())}/{len(tests)} source contract checks passed')
raise SystemExit(0 if all(tests.values()) else 1)
