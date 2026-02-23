import { useState, useEffect, useCallback } from 'react';
import { MapPin, Star, Phone, Navigation, Search, Locate, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HospitalFavorite } from '../../types';
import { hospitalFavoriteService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

interface Hospital {
    name: string;
    address: string;
    phone: string;
    type: 'hospital';
    lat: number;
    lng: number;
}

const PRESET_HOSPITALS: Hospital[] = [
    { name: 'AIIMS Delhi', address: 'Sri Aurobindo Marg, New Delhi', phone: '011-26588500', type: 'hospital', lat: 28.5672, lng: 77.2100 },
    { name: 'Safdarjung Hospital', address: 'Ansari Nagar, New Delhi', phone: '011-26707437', type: 'hospital', lat: 28.5685, lng: 77.2066 },
    { name: 'Apollo Hospital', address: 'Mathura Road, Sarita Vihar, Delhi', phone: '011-71791090', type: 'hospital', lat: 28.5300, lng: 77.2830 },
    { name: 'Fortis Hospital', address: 'Sector 62, Noida', phone: '0120-4300222', type: 'hospital', lat: 28.6262, lng: 77.3650 },
    { name: 'Max Super Speciality', address: 'Saket, New Delhi', phone: '011-26515050', type: 'hospital', lat: 28.5277, lng: 77.2144 },
    { name: 'Medanta Hospital', address: 'Sector 38, Gurugram', phone: '0124-4141414', type: 'hospital', lat: 28.4433, lng: 77.0412 },
    { name: 'Sir Ganga Ram Hospital', address: 'Rajinder Nagar, New Delhi', phone: '011-25861313', type: 'hospital', lat: 28.6380, lng: 77.1868 },
    { name: 'BLK Super Speciality', address: 'Pusa Road, New Delhi', phone: '011-30403040', type: 'hospital', lat: 28.6413, lng: 77.1785 },
];

/** Haversine distance in km */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyHospitals() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [favorites, setFavorites] = useState<HospitalFavorite[]>([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [dynamicHospitals, setDynamicHospitals] = useState<Hospital[]>([]);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

    const loadFavorites = useCallback(async () => {
        const uid = user?.uid || 'anonymous';
        setFavorites(await hospitalFavoriteService.getAll(uid));
    }, [user]);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    // Auto-detect location on mount

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError(t('Geolocation is not supported by your browser', 'आपके ब्राउज़र द्वारा जियोलोकेशन समर्थित नहीं है'));
            return;
        }
        setLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocating(false);
            },
            (err) => {
                setLocationError(err.code === 1 ? t('Location access denied. Please allow location in your browser.', 'लोकेशन एक्सेस अस्वीकार कर दिया गया। कृपया अपने ब्राउज़र में अनुमति दें।') : t('Unable to get your location', 'आपकी लोकेशन प्राप्त करने में असमर्थ'));
                setLocating(false);
                // Fallback to Delhi center
                setUserLocation({ lat: 28.6139, lng: 77.2090 });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    }, []);

    const fetchNearbyHospitals = async (lat: number, lng: number) => {
        setFetching(true);
        try {
            // Overpass API Query for hospitals within 10km
            const query = `
                [out:json][timeout:25];
                (
                  node["amenity"="hospital"](around:10000,${lat},${lng});
                  way["amenity"="hospital"](around:10000,${lat},${lng});
                  rel["amenity"="hospital"](around:10000,${lat},${lng});
                );
                out center;
            `;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch hospitals');

            const data = await response.json();
            const results: Hospital[] = data.elements.map((el: any) => ({
                name: el.tags.name || t('Unnamed Hospital', 'बिना नाम का अस्पताल'),
                address: el.tags['addr:street'] || el.tags['addr:full'] || t('Address near your location', 'आपकी लोकेशन के पास का पता'),
                phone: el.tags.phone || el.tags['contact:phone'] || t('N/A', 'उपलब्ध नहीं'),
                type: 'hospital',
                lat: el.lat || el.center.lat,
                lng: el.lon || el.center.lon
            }));

            setDynamicHospitals(results.length > 0 ? results : PRESET_HOSPITALS);
        } catch (error) {
            console.error('Hospital fetch error:', error);
            setDynamicHospitals(PRESET_HOSPITALS); // Fallback
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (userLocation) {
            fetchNearbyHospitals(userLocation.lat, userLocation.lng);
        }
    }, [userLocation]);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    const hospitalsToUse = dynamicHospitals.length > 0 ? dynamicHospitals : PRESET_HOSPITALS;

    const filteredHospitals = hospitalsToUse.filter((h: Hospital) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase())
    );

    const sortedHospitals = userLocation
        ? [...filteredHospitals].sort((a, b) =>
            distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
            distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        )
        : filteredHospitals;

    const isFavorite = (name: string) => favorites.some(f => f.name === name);

    const toggleFavorite = async (hospital: Hospital) => {
        const uid = user?.uid || 'anonymous';
        if (isFavorite(hospital.name)) {
            const fav = favorites.find(f => f.name === hospital.name);
            if (fav) await hospitalFavoriteService.remove(fav.id);
        } else {
            await hospitalFavoriteService.add({
                id: Date.now().toString(), patient_id: uid,
                name: hospital.name, address: hospital.address,
                phone: hospital.phone, type: hospital.type,
                lat: hospital.lat, lng: hospital.lng,
            });
        }
        setFavorites(await hospitalFavoriteService.getAll(uid));
    };

    const openDirections = (hospital: Hospital) => {
        const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
        const dest = `${hospital.lat},${hospital.lng}`;
        window.open(`https://www.google.com/maps/dir/${origin}/${dest}`, '_blank');
    };

    const displayList = activeTab === 'favorites'
        ? sortedHospitals.filter((h: Hospital) => isFavorite(h.name))
        : sortedHospitals;

    // Build Google Maps embed URL
    const getMapUrl = () => {
        if (selectedHospital) {
            // Show directions from user to selected hospital
            if (userLocation) {
                return `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedHospital.lat},${selectedHospital.lng}&mode=driving`;
            }
            return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedHospital.name},Delhi&center=${selectedHospital.lat},${selectedHospital.lng}&zoom=15`;
        }
        if (userLocation) {
            return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=hospitals+near+me&center=${userLocation.lat},${userLocation.lng}&zoom=13`;
        }
        return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=hospitals+in+Delhi&center=28.6139,77.2090&zoom=12`;
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-rose-100 p-2 rounded-xl"><MapPin className="w-6 h-6 text-rose-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{t('Nearby Hospitals', 'नजदीकी अस्पताल')}</h3>
                            <p className="text-sm text-gray-500">{t('Find hospitals and get directions', 'अस्पताल खोजें और दिशा-निर्देश प्राप्त करें')}</p>
                        </div>
                    </div>
                    <button onClick={requestLocation} disabled={locating}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${userLocation && !locating
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                        {locating || fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                        <span>{locating ? t('Locating...', 'ढूंढ रहे हैं...') : fetching ? t('Finding Hospitals...', 'अस्पताल खोज रहे हैं...') : userLocation ? t('Location Active', 'लोकेशन सक्रिय') : t('Get Location', 'लोकेशन प्राप्त करें')}</span>
                    </button>
                </div>

                {/* Location status */}
                {locationError && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-700">
                        ⚠️ {locationError}
                    </div>
                )}
                {userLocation && !locationError && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center justify-between">
                        <span>📍 {t('Your location:', 'आपकी लोकेशन:')} {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                        {selectedHospital && (
                            <button onClick={() => setSelectedHospital(null)} className="text-xs underline text-green-600 hover:text-green-800">
                                {t('Clear selection', 'चयन साफ़ करें')}
                            </button>
                        )}
                    </div>
                )}

                {/* Google Maps Embed */}
                <div className="rounded-xl overflow-hidden mb-6 border border-gray-200 shadow-lg">
                    <iframe
                        title="Google Maps"
                        width="100%" height="350"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                        src={getMapUrl()}
                    />
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-sm" placeholder={t('Search hospitals...', 'अस्पताल खोजें...')} />
                    </div>
                    <div className="flex bg-white/50 rounded-lg p-0.5">
                        <button onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}>{t('All', 'सभी')}</button>
                        <button onClick={() => setActiveTab('favorites')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'favorites' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}>
                            ★ {t('Favorites', 'पसंदीदा')} ({favorites.length})</button>
                    </div>
                </div>

                <div className="space-y-3">
                    {displayList.length === 0 ? (
                        <div className="text-center py-8">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">{activeTab === 'favorites' ? t('No favorites saved yet', 'अभी तक कोई पसंदीदा सहेजा नहीं गया है') : t('No hospitals found', 'कोई अस्पताल नहीं मिला')}</p>
                        </div>
                    ) : displayList.map((hospital: Hospital, idx: number) => {
                        const dist = userLocation ? distanceKm(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng) : null;
                        const isSelected = selectedHospital?.name === hospital.name;
                        return (
                            <button key={idx}
                                onClick={() => setSelectedHospital(isSelected ? null : hospital)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                    ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-200'
                                    : 'bg-white/40 border-gray-100 hover:shadow-md hover:bg-white/60'
                                    }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-semibold text-gray-800">{hospital.name}</h4>
                                            {dist !== null && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                    {dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)} km`}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                            <MapPin className="w-3 h-3 mr-1 shrink-0" />{hospital.address}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center mt-0.5">
                                            <Phone className="w-3 h-3 mr-1 shrink-0" />{hospital.phone}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => toggleFavorite(hospital)}
                                            className={`p-2 rounded-lg transition-all ${isFavorite(hospital.name) ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                                            <Star className={`w-4 h-4 ${isFavorite(hospital.name) ? 'fill-current' : ''}`} />
                                        </button>
                                        <button onClick={() => openDirections(hospital)}
                                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all">
                                            <Navigation className="w-4 h-4" />
                                        </button>
                                        <a href={`tel:${hospital.phone}`}
                                            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-all">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
