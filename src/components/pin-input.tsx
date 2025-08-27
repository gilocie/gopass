'use client';
import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PinInputProps {
  length: number;
  onComplete: (pin: string) => void;
}

export default function PinInput({ length, onComplete }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!/^[0-9]$/.test(value) && value !== '') return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    if (newPin.every((digit) => digit !== '')) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el!)}
          type="tel"
          maxLength={1}
          value={pin[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold',
            'spin-button-none'
          )}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
       <style jsx global>{`
        .spin-button-none::-webkit-outer-spin-button,
        .spin-button-none::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .spin-button-none[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
