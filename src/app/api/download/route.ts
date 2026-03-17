import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const downloadToken = await prisma.downloadToken.findUnique({
    where: { token },
    include: {
      order: { include: { buyer: true } },
      productFile: true,
    },
  })

  if (!downloadToken) {
    return NextResponse.json({ error: '無効なダウンロードリンクです' }, { status: 404 })
  }

  if (downloadToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'ダウンロードリンクの有効期限が切れています' }, { status: 410 })
  }

  if (downloadToken.order.buyer.clerkId !== userId) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
  }

  const r2Configured =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET_NAME

  if (!r2Configured) {
    return NextResponse.json({ message: 'ファイルダウンロードは準備中です' }, { status: 503 })
  }

  // R2設定済みの場合：署名付きURLを生成してリダイレクト
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  })

  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: downloadToken.productFile.r2Key,
    }),
    { expiresIn: 300 }
  )

  await prisma.downloadToken.update({
    where: { id: downloadToken.id },
    data: { downloadedAt: new Date() },
  })

  return NextResponse.redirect(signedUrl)
}
