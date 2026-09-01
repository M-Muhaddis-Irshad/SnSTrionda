import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, phone, password } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        phone,
        role: 'CUSTOMER',
      },
    });

    // LOG ACTIVITY
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (adminUser) {
        await prisma.activity.create({
          data: {
            type: 'customer',
            message: `New customer registration: ${user.name}`,
            userId: adminUser.id,
            metadata: JSON.stringify({
              email: user.email,
              phone: user.phone,
            }),
          },
        });
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Registration failed' },
      { status: 500 }
    );
  }
}
