'use client';

import React from 'react';
import Header from '@/components/Header';
import Card from '@/components/Card';

const TermsOfServicePage = () => {
  return (
    <div className="container mx-auto mt-10 p-4">
      <Header />
      <div className="mt-10">
        <Card>
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">利用規約</h1>

            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold mb-3">第1条（適用）</h2>
                <p>
                  本利用規約（以下、「本規約」といいます。）は、[あなたのサービス名]（以下、「本サービス」といいます。）の利用に関する条件を、本サービスを利用するすべてのユーザー（以下、「ユーザー」といいます。）と当社の間で��めるものです。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第2条（登録）</h2>
                <p>
                  本サービスの利用を希望する者は、本規約に同意の上利用登録するものとします。
                  登録したアカウントは1ヶ月間利用がない場合自動で削除されます。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第3条（禁止事項）</h2>
                <p>
                  ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                </p>
                <ul className="list-disc list-inside mt-2 pl-4">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>本サービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                  <li>他のユーザーに成りすます行為</li>
                  <li>その他、不適切と判断する行為</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第4条（本サービスの提供の停止等）</h2>
                <p>
                  当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                </p>
                <ul className="list-disc list-inside mt-2 pl-4">
                  <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>その他、本サービスの提供が困難と判断した場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第5条（免責事項）</h2>
                <p>
                  本サービスに伴う損失などは責任を負わないものとします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第6条（利用規約の変更）</h2>
                <p>
                  必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第7条（問題および解答について）</h2>
                <p>
                  解答の記録は3ヶ月間保持します。3ヶ月を過ぎると自動で削除されます。
                </p>
                <p>
                  問題および解答は個人または生成AIで作成しているため、誤りがあることがあります。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">第8条（アプリケーションについて）</h2>
                <p>
                  本アプリケーションのプログラムは以下に公開しています。
                </p>
                <p>
                  アプリケーションを利用してサービスの公開しても問題はありません。ただし公開の際には、下記のリンクを必ずサイトのフッターに表示してください。
                </p>
                <p>
                  <a href="https://github.com/pawn-4-git/ai-mon" target="_blank" rel="noopener noreferrer" className="group">
                    Github(https://github.com/pawn-4-git/ai-mon/)
                  </a>
                </p>
              </section>

              <p className="text-right mt-8">以上</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfServicePage;