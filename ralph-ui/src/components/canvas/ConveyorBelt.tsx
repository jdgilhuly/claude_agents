import { ReactNode } from 'react';

interface ConveyorBeltProps {
  active: boolean;
  children: ReactNode;
}

export function ConveyorBelt({ active, children }: ConveyorBeltProps) {
  return (
    <div className="relative">
      {/* Belt frame */}
      <div className="absolute inset-0 -top-2 -bottom-2 bg-factory-metal/50 rounded-lg" />

      {/* Main belt surface */}
      <div
        className={`relative h-32 bg-factory-conveyor rounded border-2 border-factory-metal overflow-hidden ${
          active ? 'animate-conveyor-move' : ''
        }`}
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 18px,
              rgba(255, 255, 255, 0.05) 18px,
              rgba(255, 255, 255, 0.05) 20px
            )
          `,
          backgroundSize: '40px 100%',
        }}
      >
        {/* Belt rails */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-factory-metal" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-factory-metal" />

        {/* Belt rollers (decorative) */}
        <div className="absolute top-1 bottom-1 left-4 w-3 rounded-full bg-factory-border" />
        <div className="absolute top-1 bottom-1 right-4 w-3 rounded-full bg-factory-border" />

        {/* Content area */}
        <div className="absolute inset-x-0 top-4 bottom-4 flex items-center px-8">
          {children}
        </div>
      </div>

      {/* Belt supports */}
      <div className="flex justify-between px-16 mt-1">
        <BeltSupport />
        <BeltSupport />
        <BeltSupport />
        <BeltSupport />
        <BeltSupport />
      </div>
    </div>
  );
}

function BeltSupport() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-4 h-6 bg-factory-metal rounded-t" />
      <div className="w-6 h-2 bg-factory-border rounded-b" />
    </div>
  );
}
