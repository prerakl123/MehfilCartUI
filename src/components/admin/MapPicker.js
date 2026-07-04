'use client';

import { useCallback, useRef, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Search, Loader2, AlertTriangle } from 'lucide-react';

import { api } from '@/lib/api';
import { APP_CONFIG } from '@/constants/config';

/**
 * Interactive location picker built on MapLibre GL.
 *
 * Lets an admin find a place via address search, then fine-tune the exact spot
 * by clicking the map or dragging the pin. Coordinates (and a suggested
 * address) are reported via `onChange`; the manually-typed address lives in the
 * parent form. Geocoding is proxied through our backend so no key is exposed.
 *
 * @param {number|null} latitude   Current pin latitude (null = no pin yet).
 * @param {number|null} longitude  Current pin longitude.
 * @param {(value: {latitude:number, longitude:number, provider?:string, placeId?:string, address?:string}) => void} onChange
 */
export default function MapPicker({ latitude, longitude, onChange }) {
    const hasPin = latitude != null && longitude != null;
    const styleUrl = APP_CONFIG.MAP_STYLE_URL;

    const [viewState, setViewState] = useState({
        longitude: hasPin ? longitude : APP_CONFIG.MAP_DEFAULT_CENTER.longitude,
        latitude: hasPin ? latitude : APP_CONFIG.MAP_DEFAULT_CENTER.latitude,
        zoom: hasPin ? APP_CONFIG.MAP_PIN_ZOOM : APP_CONFIG.MAP_DEFAULT_ZOOM,
    });

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [reversing, setReversing] = useState(false);
    const debounceRef = useRef(null);

    /** Debounced forward-geocoding search via the backend proxy. */
    const handleQueryChange = useCallback((value) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const params = new URLSearchParams({ q: value });
                if (hasPin) {
                    params.set('lat', String(latitude));
                    params.set('lng', String(longitude));
                }
                const data = await api.get(`/admin/geocode/search?${params.toString()}`);
                setResults(data.results || []);
                setShowResults(true);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, APP_CONFIG.SEARCH_DEBOUNCE_MS);
    }, [hasPin, latitude, longitude]);

    /** Pick a search suggestion: move the pin and report its address. */
    const handleSelectResult = (r) => {
        setQuery(r.formatted_address);
        setShowResults(false);
        setResults([]);
        setViewState((v) => ({
            ...v,
            latitude: r.latitude,
            longitude: r.longitude,
            zoom: APP_CONFIG.MAP_PIN_ZOOM,
        }));
        onChange({
            latitude: r.latitude,
            longitude: r.longitude,
            provider: r.provider,
            placeId: r.place_id,
            address: r.formatted_address,
        });
    };

    /** Reverse-geocode a dropped/dragged point to suggest its address. */
    const reverseGeocode = useCallback(async (lat, lng) => {
        setReversing(true);
        try {
            const r = await api.get(`/admin/geocode/reverse?lat=${lat}&lng=${lng}`);
            return { provider: r.provider, placeId: r.place_id, address: r.formatted_address };
        } catch {
            return {};
        } finally {
            setReversing(false);
        }
    }, []);

    /** Place the pin at a clicked / dragged coordinate. */
    const setPin = useCallback(async (lat, lng) => {
        // Report coordinates immediately for responsiveness, then enrich with address.
        onChange({ latitude: lat, longitude: lng });
        const extra = await reverseGeocode(lat, lng);
        onChange({ latitude: lat, longitude: lng, ...extra });
    }, [onChange, reverseGeocode]);

    if (!styleUrl) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <p className="text-sm font-medium text-foreground">Map is not configured</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                    Set <code className="rounded bg-secondary px-1">NEXT_PUBLIC_MAPTILER_KEY</code> (or{' '}
                    <code className="rounded bg-secondary px-1">NEXT_PUBLIC_MAP_STYLE_URL</code>) to enable the location picker.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Address search */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onFocus={() => results.length && setShowResults(true)}
                        placeholder="Search for a place or address…"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-9 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {searching && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                </div>
                {showResults && results.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
                        {results.map((r, i) => (
                            <li key={r.place_id || i}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectResult(r)}
                                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                                >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span className="line-clamp-2">{r.formatted_address}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Map */}
            <div className="relative h-72 w-full overflow-hidden rounded-lg border border-border">
                <Map
                    {...viewState}
                    onMove={(e) => setViewState(e.viewState)}
                    onClick={(e) => setPin(e.lngLat.lat, e.lngLat.lng)}
                    mapStyle={styleUrl}
                    style={{ width: '100%', height: '100%' }}
                    cursor="crosshair"
                >
                    <NavigationControl position="top-right" showCompass={false} />
                    {hasPin && (
                        <Marker
                            longitude={longitude}
                            latitude={latitude}
                            draggable
                            anchor="bottom"
                            onDragEnd={(e) => setPin(e.lngLat.lat, e.lngLat.lng)}
                        >
                            <MapPin className="h-8 w-8 fill-primary/20 text-primary drop-shadow" />
                        </Marker>
                    )}
                </Map>
                {reversing && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow">
                        <Loader2 className="h-3 w-3 animate-spin" /> Looking up address…
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                {hasPin
                    ? `Pinned at ${latitude.toFixed(5)}, ${longitude.toFixed(5)} — click the map or drag the pin to adjust.`
                    : 'Search above, or click the map to drop a pin.'}
            </p>
        </div>
    );
}
