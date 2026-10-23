export type PartFamily = 'engine' | 'turbo' | 'brake' | 'suspension' | 'aero' | 'gearbox' | 'drivetrain' | 'cooling' | 'intake' | 'exhaust' | 'electrical' | 'fuel' | 'wheel' | 'chassis' | 'steering';
export type PartSpec = {
    id: string;
    family: PartFamily;
    label: string;
    mounts: readonly string[];
};
export const PARTS = [
    { id: 'inline-3', family: 'engine', label: 'Inline three-cylinder', mounts: ['output', 'intake', 'exhaust'] },
    { id: 'inline-4', family: 'engine', label: 'Inline four-cylinder', mounts: ['output', 'intake', 'exhaust'] },
    { id: 'inline-6', family: 'engine', label: 'Inline six-cylinder', mounts: ['output', 'intake', 'exhaust'] },
    { id: 'v6', family: 'engine', label: 'V6 engine', mounts: ['output', 'intake', 'exhaust'] },
    { id: 'v8', family: 'engine', label: 'V8 engine', mounts: ['output', 'intake', 'exhaust'] },
    { id: 'flat-4', family: 'engine', label: 'Flat-four engine', mounts: ['output', 'intake', 'exhaust'] },
    { id: 'turbo-small', family: 'turbo', label: 'Compact single turbo', mounts: ['intake', 'outlet', 'exhaust-in', 'exhaust-out'] },
    { id: 'turbo-large', family: 'turbo', label: 'Large single turbo', mounts: ['intake', 'outlet', 'exhaust-in', 'exhaust-out'] },
    { id: 'turbo-twin-scroll', family: 'turbo', label: 'Twin-scroll turbo', mounts: ['intake', 'outlet', 'exhaust-in', 'exhaust-out'] },
    { id: 'turbo-twin', family: 'turbo', label: 'Twin turbo pair', mounts: ['intake', 'outlet', 'exhaust-in', 'exhaust-out'] },
    { id: 'brake-solid', family: 'brake', label: 'Solid disc brake', mounts: ['axle', 'hydraulic'] },
    { id: 'brake-vented', family: 'brake', label: 'Vented disc brake', mounts: ['axle', 'hydraulic'] },
    { id: 'brake-drilled', family: 'brake', label: 'Drilled performance brake', mounts: ['axle', 'hydraulic'] },
    { id: 'brake-drum', family: 'brake', label: 'Drum brake', mounts: ['axle', 'hydraulic'] },
    { id: 'strut', family: 'suspension', label: 'Strut and coil spring', mounts: ['body', 'hub'] },
    { id: 'double-wishbone', family: 'suspension', label: 'Double wishbone corner', mounts: ['body', 'hub'] },
    { id: 'multi-link', family: 'suspension', label: 'Multi-link corner', mounts: ['body', 'hub'] },
    { id: 'leaf-spring', family: 'suspension', label: 'Leaf spring axle unit', mounts: ['body', 'hub'] },
    { id: 'front-splitter', family: 'aero', label: 'Front splitter', mounts: ['body'] },
    { id: 'rear-wing', family: 'aero', label: 'Adjustable rear wing', mounts: ['body'] },
    { id: 'ducktail', family: 'aero', label: 'Ducktail lip', mounts: ['body'] },
    { id: 'diffuser', family: 'aero', label: 'Rear diffuser', mounts: ['body'] },
    { id: 'canards', family: 'aero', label: 'Front canard pair', mounts: ['body'] },
    { id: 'undertray', family: 'aero', label: 'Flat undertray', mounts: ['body'] },
    { id: 'gearbox-manual', family: 'gearbox', label: 'Manual gearbox', mounts: ['input', 'output'] },
    { id: 'gearbox-auto', family: 'gearbox', label: 'Automatic gearbox', mounts: ['input', 'output'] },
    { id: 'gearbox-dct', family: 'gearbox', label: 'Dual-clutch gearbox', mounts: ['input', 'output'] },
    { id: 'propshaft', family: 'drivetrain', label: 'Propeller shaft', mounts: ['input', 'output'] },
    { id: 'differential-open', family: 'drivetrain', label: 'Open differential', mounts: ['input', 'output'] },
    { id: 'differential-lsd', family: 'drivetrain', label: 'Limited-slip differential', mounts: ['input', 'output'] },
    { id: 'cv-halfshaft', family: 'drivetrain', label: 'CV halfshaft', mounts: ['input', 'output'] },
    { id: 'radiator', family: 'cooling', label: 'Engine radiator', mounts: ['inlet', 'outlet'] },
    { id: 'intercooler', family: 'cooling', label: 'Front-mount intercooler', mounts: ['inlet', 'outlet'] },
    { id: 'oil-cooler', family: 'cooling', label: 'Oil cooler', mounts: ['inlet', 'outlet'] },
    { id: 'cooling-fan', family: 'cooling', label: 'Electric cooling fan', mounts: ['inlet', 'outlet'] },
    { id: 'airbox', family: 'intake', label: 'Intake airbox', mounts: ['inlet', 'outlet'] },
    { id: 'cone-filter', family: 'intake', label: 'Cone air filter', mounts: ['inlet', 'outlet'] },
    { id: 'throttle-body', family: 'intake', label: 'Electronic throttle body', mounts: ['inlet', 'outlet'] },
    { id: 'exhaust-header', family: 'exhaust', label: 'Four-branch exhaust header', mounts: ['inlet', 'outlet'] },
    { id: 'muffler', family: 'exhaust', label: 'Rear exhaust silencer', mounts: ['inlet', 'outlet'] },
    { id: 'catalyst', family: 'exhaust', label: 'Catalytic converter', mounts: ['inlet', 'outlet'] },
    { id: 'starter', family: 'electrical', label: 'Starter motor', mounts: ['power', 'drive'] },
    { id: 'alternator', family: 'electrical', label: 'Alternator', mounts: ['power', 'drive'] },
    { id: 'battery-12v', family: 'electrical', label: '12-volt battery', mounts: ['power', 'drive'] },
    { id: 'ev-drive', family: 'electrical', label: 'EV motor and reduction unit', mounts: ['power', 'drive'] },
    { id: 'fuel-tank', family: 'fuel', label: 'Underfloor fuel tank', mounts: ['inlet', 'outlet'] },
    { id: 'fuel-pump', family: 'fuel', label: 'In-tank fuel pump module', mounts: ['inlet', 'outlet'] },
    { id: 'injector-rail', family: 'fuel', label: 'Four-injector fuel rail', mounts: ['inlet', 'outlet'] },
    { id: 'wheel-road', family: 'wheel', label: 'Road wheel and tyre', mounts: ['axle'] },
    { id: 'wheel-sport', family: 'wheel', label: 'Sport wheel and tyre', mounts: ['axle'] },
    { id: 'wheel-offroad', family: 'wheel', label: 'All-terrain wheel and tyre', mounts: ['axle'] },
    { id: 'subframe', family: 'chassis', label: 'Front cradle subframe', mounts: ['body', 'left', 'right'] },
    { id: 'ladder-frame', family: 'chassis', label: 'Utility ladder frame', mounts: ['body', 'left', 'right'] },
    { id: 'steering-rack', family: 'steering', label: 'Rack-and-pinion steering', mounts: ['input', 'left', 'right'] },
    { id: 'steering-column', family: 'steering', label: 'Steering column and joints', mounts: ['input', 'left', 'right'] },
] as const satisfies readonly PartSpec[];
export type PartVariant = typeof PARTS[number]['id'];
export function partSpec(id: string): PartSpec { const s = PARTS.find(s => s.id === id); if (!s)
    throw new Error(`Unknown part: ${id}`); return s; }
export type PartOptions = {
    variant: PartVariant;
    color?: string;
    accent?: string;
    cutaway?: boolean;
};
