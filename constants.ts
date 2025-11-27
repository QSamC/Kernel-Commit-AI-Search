export const SAMPLE_GIT_LOG = `
commit 9f4ad9e425a1d3b6a342113e62547077553a6f44
Author: Linus Torvalds <torvalds@linux-foundation.org>
Date:   Sun Mar 3 13:34:22 2024 -0800
    Linux 6.8-rc7

commit 1b929c02afd378a9d80b7418751547361895690f
Author: Andrii Nakryiko <andrii@kernel.org>
Date:   Tue Feb 27 15:12:03 2024 -0800
    bpf: fix use-after-free in bpf_local_storage_map_alloc
    
    When allocating local storage map, we need to be careful about
    cleaning up memory on failure. There was a path where we could
    free memory that was already linked into the list, causing UAF.

commit 8d4a2f1c3e5b6a7d8e9f0a1b2c3d4e5f6g7h8i9j
Author: Jens Axboe <axboe@kernel.dk>
Date:   Mon Feb 26 10:22:11 2024 -0700
    io_uring: add support for IORING_OP_FUTEX_WAIT
    
    This adds support for futex waiting via io_uring. This is useful
    for applications that want to wait on a futex without blocking
    the submission thread.

commit 7c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8g7h6i5
Author: Paolo Abeni <pabeni@redhat.com>
Date:   Fri Feb 23 14:55:33 2024 +0100
    net: sched: fix race condition in qdisc_create
    
    There is a race window between qdisc lookup and creation where
    another thread could validly create the qdisc.

commit 5a6b7c8d9e0f1a2b3c4d5e6f7g8h9i0j1k2l3m4
Author: Masahiro Yamada <masahiroy@kernel.org>
Date:   Wed Feb 21 09:11:00 2024 +0900
    kbuild: support LLVM=1 for all architectures
    
    Now that all architectures support LLVM=1, we can simplify the
    logic in the Makefile to avoid special casing.

commit 3e2d1c0b9a8f7e6d5c4b3a2109f8e7d6c5b4a3
Author: Peter Zijlstra <peterz@infradead.org>
Date:   Tue Feb 20 11:44:22 2024 +0100
    sched/fair: improve load balancing on heterogeneous systems
    
    On Big.Little systems, the load balancer sometimes migrates tasks
    to little cores prematurely. Adjust the imbalance calculation.

commit 2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3
Author: Hans Verkuil <hverkuil-cisco@xs4all.nl>
Date:   Mon Feb 19 13:22:11 2024 +0100
    media: v4l2-core: fix potential null pointer dereference
    
    In v4l2_fh_release, we check for vdev being NULL, but strictly
    speaking it can be accessed before that check in some paths.

commit 1z2y3x4w5v6u7t8s9r0q1p2o3n4m5l6k7j8i9h
Author: Arnd Bergmann <arnd@arndb.de>
Date:   Fri Feb 16 16:33:44 2024 +0100
    arch: remove support for ancient a.out binaries
    
    Support for a.out binaries has been deprecated for a long time.
    It is time to remove it to clean up the codebase.

commit 9i8h7g6f5e4d3c2b1a0z9y8x7w6v5u4t3s2r1q
Author: Jakub Kicinski <kuba@kernel.org>
Date:   Thu Feb 15 10:10:10 2024 -0800
    eth: bnxt_en: improve error recovery logic
    
    When firmware resets, the driver needs to re-initialize rings
    more robustly to avoid packet drops during recovery.

commit 4m5l6k7j8i9h0g1f2e3d4c5b6a7z8y9x0w1v2u
Author: Kent Overstreet <kent.overstreet@linux.dev>
Date:   Wed Feb 14 09:05:00 2024 -0500
    bcachefs: fix deadlock in transaction commit path
    
    We were taking locks in the wrong order in __bch2_trans_commit,
    leading to a potential ABBA deadlock with the journal lock.
`;
