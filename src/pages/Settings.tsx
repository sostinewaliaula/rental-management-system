import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { User2Icon, MailIcon, PhoneIcon, LockIcon, KeyIcon, BellIcon, SmartphoneIcon, BuildingIcon, ImageIcon, CheckCircle2Icon, AlertCircleIcon, Trash2Icon, UploadIcon, EyeIcon, ShieldCheckIcon } from 'lucide-react';

// Modal component (copied/adapted)
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  };
  if (!open) return null;
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-2 font-sans"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-green-50 via-white to-green-100 rounded-3xl shadow-2xl p-6 w-[90vw] min-h-[40vh] max-h-[80vh] max-w-2xl relative animate-fadeIn flex flex-col gap-2 overflow-y-auto border border-green-100">
        <button type="button" onClick={onClose} className="absolute top-6 right-8 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded transition-all cursor-pointer z-10" aria-label="Close">Close</button>
        <h2 className="text-2xl font-extrabold mb-6 text-green-800 text-center tracking-wide leading-tight drop-shadow-sm font-sans">{title}</h2>
        <div className="w-full flex flex-col gap-6 text-base text-gray-800 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Settings = () => {
  const { token, user, login } = useAuth();
  // Profile state
  const [profile, setProfile] = useState({
    avatar: '',
    name: '',
    email: '',
    phone: '',
  });
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Account state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({ current: '', new: '', confirm: '' });
  const [twoFA, setTwoFA] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });

  // Organization state
  const [org, setOrg] = useState({
    name: 'Nyumbani Rentals',
    address: '123 Riverside Drive, Nairobi',
    logo: '',
  });
  const [orgEdit, setOrgEdit] = useState(false);
  const [orgDraft, setOrgDraft] = useState(org);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Security state
  const [devices, setDevices] = useState([
    { id: 1, name: 'iPhone 13', location: 'Nairobi, Kenya', lastActive: '2023-10-10 09:12', current: true },
    { id: 2, name: 'Windows Laptop', location: 'Nairobi, Kenya', lastActive: '2023-10-09 21:30', current: false },
    { id: 3, name: 'iPad', location: 'Mombasa, Kenya', lastActive: '2023-10-05 14:22', current: false },
  ]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceToRemove, setDeviceToRemove] = useState<any>(null);

  // Load current user profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          setProfile(p => ({ ...p, name: data.user.name, email: data.user.email }));
        }
      } catch {}
    })();
  }, [token]);

  // Summary stats
  const profileComplete = profile.name && profile.email && profile.phone && profile.avatar;
  const notificationsEnabled = notifications.email || notifications.sms || notifications.push;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><User2Icon size={22} /></div>
          <div className="text-2xl font-bold text-gray-800">{profileComplete ? '100%' : '80%'}</div>
          <div className="text-sm text-gray-500">Profile Complete</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 mb-2"><ShieldCheckIcon size={22} /></div>
          <div className="text-2xl font-bold text-blue-700">{twoFA ? 'Enabled' : 'Disabled'}</div>
          <div className="text-sm text-gray-500">2FA Status</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 mb-2"><SmartphoneIcon size={22} /></div>
          <div className="text-2xl font-bold text-yellow-700">{devices.length}</div>
          <div className="text-sm text-gray-500">Devices</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-purple-50 text-purple-700 mb-2"><BellIcon size={22} /></div>
          <div className="text-2xl font-bold text-purple-700">{notificationsEnabled ? 'On' : 'Off'}</div>
          <div className="text-sm text-gray-500">Notifications</div>
        </div>
      </div>
      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 mb-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-20 h-20">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-green-200 shadow" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-3xl font-bold border-2 border-green-200 shadow">
                <User2Icon size={36} />
              </div>
            )}
            {profileEdit && (
              <label className="absolute bottom-0 right-0 bg-green-700 text-white rounded-full p-2 cursor-pointer hover:bg-green-800 transition-all shadow-lg">
                <UploadIcon size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-800">Profile</h2>
              {!profileEdit && <button className="ml-2 px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 text-sm" onClick={() => { setProfileEdit(true); setProfileDraft(profile); }}>Edit</button>}
              {profileEdit && (
                <>
                  <button className="ml-2 px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 text-sm" onClick={async () => {
                    // In a real app, call backend to update profile fields if supported
                    setProfile(profileDraft);
                    setProfileEdit(false);
                  }}>Save</button>
                  <button className="ml-2 px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm" onClick={() => setProfileEdit(false)}>Cancel</button>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                {profileEdit ? (
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={profileDraft.name} onChange={e => setProfileDraft({ ...profileDraft, name: e.target.value })} />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{profile.name}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {profileEdit ? (
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={profileDraft.email} onChange={e => setProfileDraft({ ...profileDraft, email: e.target.value })} />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{profile.email}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {profileEdit ? (
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={profileDraft.phone} onChange={e => setProfileDraft({ ...profileDraft, phone: e.target.value })} />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{profile.phone}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Account Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Account</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-lg flex items-center gap-2" onClick={() => setShowPasswordModal(true)}><KeyIcon size={18} /> Change Password</button>
          <button className={`py-2 px-4 rounded-lg flex items-center gap-2 ${twoFA ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setTwoFA(v => !v)}><ShieldCheckIcon size={18} /> {twoFA ? 'Disable 2FA' : 'Enable 2FA'}</button>
          <button className="bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded-lg flex items-center gap-2" onClick={() => setShowDeleteModal(true)}><Trash2Icon size={18} /> Delete Account</button>
        </div>
      </div>
      {/* Notifications Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="notifEmail" checked={notifications.email} onChange={e => setNotifications(n => ({ ...n, email: e.target.checked }))} className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            <label htmlFor="notifEmail" className="text-gray-700">Email</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="notifSMS" checked={notifications.sms} onChange={e => setNotifications(n => ({ ...n, sms: e.target.checked }))} className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            <label htmlFor="notifSMS" className="text-gray-700">SMS</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="notifPush" checked={notifications.push} onChange={e => setNotifications(n => ({ ...n, push: e.target.checked }))} className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            <label htmlFor="notifPush" className="text-gray-700">Push</label>
          </div>
        </div>
      </div>
      {/* Organization Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Organization</h2>
          {!orgEdit && <button className="ml-2 px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 text-sm" onClick={() => { setOrgEdit(true); setOrgDraft(org); }}>Edit</button>}
          {orgEdit && (
            <>
              <button className="ml-2 px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 text-sm" onClick={() => { setOrg(orgDraft); setOrgEdit(false); }}>Save</button>
              <button className="ml-2 px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm" onClick={() => setOrgEdit(false)}>Cancel</button>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            {orgEdit ? (
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={orgDraft.name} onChange={e => setOrgDraft({ ...orgDraft, name: e.target.value })} />
            ) : (
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{org.name}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            {orgEdit ? (
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={orgDraft.address} onChange={e => setOrgDraft({ ...orgDraft, address: e.target.value })} />
            ) : (
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{org.address}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            {orgEdit ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <UploadIcon size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                <span className="text-gray-500">Upload Logo</span>
              </label>
            ) : (
              org.logo ? <img src={org.logo} alt="logo" className="w-16 h-16 object-cover rounded-lg border border-green-100" /> : <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center text-green-700"><ImageIcon size={28} /></div>
            )}
          </div>
        </div>
      </div>
      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Security</h2>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Logins</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map(device => (
              <div key={device.id} className={`flex items-center gap-4 p-4 rounded-lg border ${device.current ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'} shadow-sm`}>
                <SmartphoneIcon size={22} className="text-green-500" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{device.name}</div>
                  <div className="text-sm text-gray-500">{device.location}</div>
                  <div className="text-xs text-gray-400">Last active: {device.lastActive}</div>
                </div>
                {device.current ? (
                  <span className="text-green-700 text-xs font-bold px-2 py-1 rounded-full bg-green-100">Current</span>
                ) : (
                  <button className="text-red-600 hover:text-red-800 text-xs font-bold px-2 py-1 rounded-full bg-red-100" onClick={() => { setDeviceToRemove(device); setShowDeviceModal(true); }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <ShieldCheckIcon size={20} className={twoFA ? 'text-green-500' : 'text-gray-400'} />
          <span className="text-gray-700">2FA is <span className={twoFA ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{twoFA ? 'Enabled' : 'Disabled'}</span></span>
        </div>
      </div>
      {/* Modals */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <form className="flex flex-col gap-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!passwordDraft.new || passwordDraft.new !== passwordDraft.confirm) return;
          try {
            const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: passwordDraft.current, newPassword: passwordDraft.new }) });
            const data = await res.json();
            if (res.ok) {
              setShowPasswordModal(false);
              setPasswordDraft({ current: '', new: '', confirm: '' });
            }
          } catch {}
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={passwordDraft.current} onChange={e => setPasswordDraft({ ...passwordDraft, current: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={passwordDraft.new} onChange={e => setPasswordDraft({ ...passwordDraft, new: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={passwordDraft.confirm} onChange={e => setPasswordDraft({ ...passwordDraft, confirm: e.target.value })} />
          </div>
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"><KeyIcon size={16} /> Change Password</button>
        </form>
      </Modal>
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account?">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Are you sure you want to delete your account? This action cannot be undone.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800 text-sm hover:bg-gray-300">Cancel</button>
            <button className="px-4 py-2 bg-red-700 rounded-lg text-white text-sm hover:bg-red-800">Delete</button>
          </div>
        </div>
      </Modal>
      <Modal open={showDeviceModal} onClose={() => setShowDeviceModal(false)} title="Remove Device?">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Are you sure you want to remove this device?</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => setShowDeviceModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800 text-sm hover:bg-gray-300">Cancel</button>
            <button className="px-4 py-2 bg-red-700 rounded-lg text-white text-sm hover:bg-red-800" onClick={() => { setDevices(devices.filter(d => d !== deviceToRemove)); setShowDeviceModal(false); }}>Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 